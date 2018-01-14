import express from "express";
import { address } from "ip";
import bodyParser from "body-parser";
import { file as tempfile } from "tempy";
import { writeFile, exists } from "fs-extra";
import { join } from "path";
import md5 from "md5";
import cors from "cors";
import morgan from "morgan";
import axios from "axios";
import { parse } from "onml";

import {
  discoverBMCs,
  remote,
  fail,
  parseTable,
  parseDict,
  exec2str as exec
} from "./utils";

import mapping from "../config/mapping";
import credentials from "../config/credentials";

process.on("unhandledRejection", up => {
  throw up;
});

const imgPath = "/home/ankh/images";
const ipxeSrcLocation = "/media/ankh/data/depot/git/ipxe/src";
const port = 1234;

const app = express();

const jsonParser = bodyParser.json();

app.use("/images", express.static(imgPath));
app.use(cors());
app.use(morgan("tiny"));

app.get("/bmc", async (req, res) => res.json(await discoverBMCs()));

const getConn = ip => remote({ ip, ...credentials[ip] });

app.get("/bmc/:ip/status", async (req, res) => {
  const { ip } = req.params;
  const conn = getConn(ip);
  res.json(parseDict(await conn("chassis status")));
});

app.get("/bmc/:ip/sensors", async (req, res) => {
  const { ip } = req.params;
  const conn = getConn(ip);
  res.json(parseTable(await conn("sdr")));
});

app.post("/bmc/:ip/cmd", jsonParser, async (req, res) => {
  const { ip } = req.params;
  const { cmd } = req.body;

  const conn = getConn(ip);

  res.json(await conn(cmd));
});

app.post("/bmc/:ip/power", jsonParser, async (req, res) => {
  const { ip } = req.params;
  const { on, bootmode } = req.body;

  const conn = getConn(ip);

  await conn(`chassis bootdev pxe`);
  await conn(`chassis power ${on ? "on" : "off"}`);
  res.status(200).send();
});

const findTag = (parent, tag) =>
  parent.find(n => Array.isArray(n) && n[0] === tag);

const findMACs = onml => {
  const hsi = findTag(onml, "HSI");
  const nics = findTag(hsi, "NICS");

  const findMAC = nic => findTag(nic, "MACADDR")[2];
  const macs = nics.slice(2).map(findMAC);

  return macs;
};

app.post("/bmc/:ip/mapping", jsonParser, async (req, res) => {
  const { ip } = req.params;
  const { iso } = req.body;

  const { data } = await axios.get(`http://${ip}/xmldata?item=all`);

  const macs = findMACs(parse(data));
  for (let mac of macs) {
    mapping[mac] = iso;
  }
  console.log(ip, iso, macs);
  await writeFile("config/mapping.json", JSON.stringify(mapping));

  res.json(macs);
});

app.get("/creds/:ip", (req, res) => {
  const { ip } = req.params;

  res.json(credentials[ip] || {});
});

app.post("/creds/:ip", jsonParser, async (req, res) => {
  const { ip } = req.params;
  const creds = req.body;

  credentials[ip] = creds;
  await writeFile("config/credentials.json", JSON.stringify(credentials));

  res.status(200).send();
});

app.get("/pixiecore/v1/boot/:mac", async ({ params: { mac } }, res) => {
  const selfIP = address();

  const pxeScriptFile = tempfile();
  const isoName =
    mapping[mac.toLowerCase()] || fail("ISO corresponding to MAC not found");
  const pxeScript = `#!ipxe
dhcp && sanboot http://${selfIP}:${port}/images/${isoName}
`;

  const hash = md5(mac + pxeScript);

  const buildScriptFile = tempfile();
  const kernelFile = join(imgPath, hash);
  const buildScript = `#!/usr/bin/env bash
cd ${ipxeSrcLocation}
make bin/undionly.kpxe EMBED=${pxeScriptFile}
cp -f bin/undionly.kpxe ${kernelFile}
`;

  if (!await exists(kernelFile)) {
    await writeFile(pxeScriptFile, pxeScript);
    await writeFile(buildScriptFile, buildScript);
    await exec(`chmod +x ${buildScriptFile}`);
    await exec(buildScriptFile);
  }

  const response = {
    kernel: `http://${selfIP}:${port}/images/${hash}`
  };

  res.json(response);
});

app.listen(port, () => console.log("PXE server started"));
