import test from "ava";

import { isIPv4 } from "net";

import { discoverBMCs } from "../src/utils";

test("Can discover BMCs", t => {
  const result = discoverBMCs();
  result.sort();

  t.snapshot(result);
  result.map(x => t.true(isIPv4(x)));
});
