import React, { Component } from "react";
import Form from "react-jsonschema-form";
import Fluture from "fluture";

import {
  // FP
  compose,
  pipe,
  map,
  map2,
  chain,
  sequence,
  reduce,
  concat,
  keys,
  sortBy,
  prop,
  // HTTP
  rest,
  // Futures
  all,
  // Logging
  cerr,
  clog,
  trace,
  fail
} from "../fp";
import { Table } from "./Table";

const baseUrl = "http://localhost:1234";
const { get, post } = rest(baseUrl);

const fetchInfo = pipe([
  get,
  map2(id => get(`/bmc/${id}/status`).map(content => ({ id, content }))),
  chain(all),
  map(sortBy(prop("id")))
])("/bmc");

const tabulate = data => {
  const contentKeys = pipe([prop("content"), keys]);
  const dupedFields = chain(contentKeys)(data);

  const fields = [...new Set(dupedFields)];

  return { fields, data };
};

const actions = {
  SetPower: {
    fields: {
      state: {
        type: "string",
        enum: ["on", "off", "reset"]
      }
    },
    impl: ({ state, targets }) => {
      all(
        targets.map(ip =>
          post(`/bmc/${ip}/cmd`, { cmd: `chassis power ${state}` })
        )
      ).fork(cerr, clog);
    }
  },
  Provision: {
    fields: {
      iso: {
        type: "string"
      }
    },
    impl: ({ iso, targets }) => {
      const setMapping = all(
        targets.map(ip => post(`/bmc/${ip}/mapping`, { iso }))
      );

      const rebootSequence = [
        "chassis power off",
        "chassis bootdev pxe",
        "chassis power on"
      ];

      const reboot = all(
        targets.map(ip =>
          sequence(Fluture)(
            rebootSequence.map(cmd => post(`/bmc/${ip}/cmd`, { cmd }))
          )
        )
      );

      setMapping.chain(() => reboot).fork(cerr, clog);
    }
  }
};
const action2schema = (ips, action) => ({
  type: "object",
  properties: {
    ...action,
    targets: {
      type: "array",
      items: {
        type: "string",
        enum: ips
      },
      uniqueItems: true
    }
  }
});

const ActionUITabs = labels => ({ activeAction }, set) => {
  return (
    <div className="tabs">
      <ul>
        {labels.map(l => (
          <li className={activeAction === l ? "is-active" : ""}>
            <a onClick={() => set({ activeAction: l })}>{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};
const ActionUI = actions => (state, set) => {
  console.log(actions, state);
  const { actionStates: states, activeAction: active, nodes } = state;

  const labels = keys(actions);
  const tabs = ActionUITabs(labels)(state, set);

  const ips = nodes.map(n => n.id);
  const action = actions[active];
  const schema = action2schema(ips, action.fields);
  const form = (
    <Form
      schema={schema}
      formData={states[active]}
      onChange={({ formData: n }) =>
        set({
          actionStates: { ...states, [active]: n }
        })
      }
      onSubmit={({ formData: n }) => action.impl(n)}
    />
  );

  return (
    <div>
      {tabs}
      {form}
    </div>
  );
};

const customFields = {
  "System Power": x => {
    const on = x.content["System Power"] === "on";
    post(`/bmc/${x.id}/power`, { on: !on }).fork(cerr, clog);
  }
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { nodes: [], activeAction: "SetPower", actionStates: {} };

    const updateStatus = () =>
      fetchInfo.fork(fail, nodes => this.updateState({ nodes }));
    setInterval(updateStatus, 500);
  }

  updateState(next) {
    this.setState({ ...this.state, ...next });
  }

  render() {
    const ips = this.state.nodes.map(n => n.id);
    const { data, fields } = tabulate(this.state.nodes);
    const table = Table(fields)(data);
    const actionUI = ActionUI(actions)(this.state, n => this.updateState(n));
    return (
      <div>
        <h1>Status</h1>
        {table}
        <h1>Actions</h1>
        {actionUI}
      </div>
    );
  }
}

export default App;
