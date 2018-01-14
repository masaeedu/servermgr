import { create, env } from "sanctuary";
import { env as flutureEnv } from "fluture-sanctuary-types";
import Fluture, { parallel, encaseP, tryP, encaseP2 } from "fluture";

// FP
export const {
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
export const map2 = compose(map, map);
export const map3 = compose(map, map, map);

// HTTP
export const rest = baseUrl => ({
  get: url =>
    encaseP(fetch)(`${baseUrl}${url}`).chain(res => tryP(_ => res.json())),
  post: (url, body) =>
    encaseP2(fetch)(`${baseUrl}${url}`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
});

// Futures
export const all = parallel(10);

const bind = o =>
  Object.keys(o)
    .map(k => ({ [k]: typeof o[k] === "function" ? o[k].bind(o) : o[k] }))
    .reduce((l, r) => ({ ...l, ...r }));

// Logging
export const { error: cerr, log: clog } = bind(console);

export const trace = o => {
  clog(o);
  return o;
};
export const fail = e => {
  throw new Error(e);
};
