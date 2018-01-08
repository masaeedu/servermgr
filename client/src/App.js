import React, { Component } from "react";

import { create, env } from "sanctuary";
import { env as flutureEnv } from "fluture-sanctuary-types";
import Fluture, { parallel, encaseP, tryP, encaseP2 } from "fluture";

// -- Utils

const {
  compose,
  pipe,
  map,
  chain,
  sequence,
  reduce,
  concat,
  keys,
  sortBy,
  prop
} = create({
  checkTypes: false,
  env: env.concat(flutureEnv)
});
const map2 = compose(map, map);
const map3 = compose(map, map, map);

const fetch_ = url =>
  encaseP(fetch)(`${baseUrl}${url}`).chain(res => tryP(_ => res.json()));
const post_ = (url, body) =>
  encaseP2(fetch)(`${baseUrl}${url}`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
const all = parallel(10);

const bind = o =>
  Object.keys(o)
    .map(k => ({ [k]: typeof o[k] === "function" ? o[k].bind(o) : o[k] }))
    .reduce((l, r) => ({ ...l, ...r }));

const { error: cerr, log: clog } = bind(console);

const trace = o => {
  clog(o);
  return o;
};
const fail = e => {
  throw new Error(e);
};

// -- Code

const baseUrl = "http://192.168.10.229";

const fetchInfo = pipe([
  fetch_,
  map2(id => fetch_(`/bmc/${id}/status`).map(content => ({ id, content }))),
  chain(all),
  map(sortBy(prop("id")))
])("/bmc");

const toggles = {
  "System Power": x => {
    const on = x.content["System Power"] === "on";
    post_(`/bmc/${x.id}/power`, { on: !on }).fork(cerr, clog);
  }
};

const Table = ({ fields, data, toggles }) => (
  <table className="table">
    <thead>
      <tr>
        <th />
        {fields.map(f => <th key={f}>{f}</th>)}
      </tr>
    </thead>
    <tbody>
      {data.map(x => (
        <tr>
          <th>{x.id}</th>
          {fields.map(f => (
            <td key={f}>
              {toggles[f] ? (
                <a className="button" onClick={() => toggles[f](x)}>
                  {x.content[f]}
                </a>
              ) : (
                x.content[f]
              )}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const tabulate = data => {
  const dupedFields = chain(pipe([x => x.content, keys]))(data);
  const fields = [...new Set(dupedFields)];

  return { fields, data };
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { nodes: [] };

    setInterval(
      () => fetchInfo.fork(fail, nodes => this.setState({ nodes })),
      1000
    );
  }

  render() {
    return <div>{Table({ ...tabulate(this.state.nodes), toggles })}</div>;
  }
}

export default App;
