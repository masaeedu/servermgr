import { exec } from "mz/child_process";

export const exec2str = async cmd => (await exec(cmd)).join("");

export const parseDiscoverBMCOutput = text => {
  const dataRegex = /\d{2}\|.+\|(.+)\|/;

  return text
    .split("\n")
    .map(x => dataRegex.exec(x))
    .filter(x => x)
    .map(x => x[1].trim());
};

export const parseByLines = separator => f => text =>
  text
    .split("\n")
    .map(x => x.split(separator))
    .map(a => a.map(x => x.trim()))
    .map(f)
    .reduce((l, r) => ({ ...l, ...r }));

export const parseTable = parseByLines("|")(([k, ...v]) => ({ [k]: v }));
export const parseDict = parseByLines(":")(([k, v]) => ({ [k]: v }));

export const discoverBMCs = async () => {
  const rawOutput = await exec2str("ipmiutil discover");
  console.log(rawOutput);
  return parseDiscoverBMCOutput(rawOutput);
};

export const remote = ({ ip, username, password }) => cmd =>
  exec2str(
    `ipmitool -I lanplus -H ${ip} -U ${username} -P ${password} ${cmd} || echo "cmd failed"`
  );

export const fail = reason => {
  throw new Error(reason);
};
