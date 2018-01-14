import express from "express";
import { exec } from "shelljs";
import { address } from "ip";
import bodyParser from "body-parser";
import { file as tempfile } from "tempy";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import md5 from "md5";
import cors from "cors";
import morgan from "morgan";
import axios from "axios";
import { parse } from "onml";

import { discoverBMCs, remote, fail, parseTable, parseDict } from "./utils";

import mapping from "../config/mapping";
import credentials from "../config/credentials";

const imgPath = "/tmp/images";
const ipxeSrcLocation = "/media/ankh/data/depot/git/ipxe/src";
const port = 1234;

const app = express();

const jsonParser = bodyParser.json();

app.use("/images", express.static(imgPath));
app.use(cors());
app.use(morgan("tiny"));

app.get("/bmc", (req, res) => res.json(discoverBMCs()));

const getConn = ip => remote({ ip, ...credentials[ip] });

app.get("/bmc/:ip/status", (req, res) => {
  const { ip } = req.params;
  const conn = getConn(ip);
  res.json(parseDict(conn("chassis status")));
});

app.get("/bmc/:ip/sensors", (req, res) => {
  const { ip } = req.params;
  const conn = getConn(ip);
  res.json(parseTable(conn("sdr")));
});

app.post("/bmc/:ip/cmd", jsonParser, (req, res) => {
  const { ip } = req.params;
  const { cmd } = req.body;

  const conn = getConn(ip);

  res.json(conn(cmd));
});

app.post("/bmc/:ip/power", jsonParser, (req, res) => {
  const { ip } = req.params;
  const { on, bootmode } = req.body;

  const conn = getConn(ip);

  conn(`chassis bootdev pxe`);
  conn(`chassis power ${on ? "on" : "off"}`);
  res.status(200).send();
});

const findTag = (parent, tag) =>
  parent.find(n => Array.isArray(n) && n[0] === tag);

const findMACs = onml => {
  console.log(onml);
  const hsi = findTag(onml, "HSI");
  const nics = findTag(hsi, "NICS");

  const findMAC = nic => findTag(nic, "MACADDR")[2];
  const macs = nics.slice(2).map(findMAC);

  return macs;
};

app.post("/bmc/:ip/mapping", jsonParser, (req, res) => {
  const { ip } = req.params;
  const { iso } = req.body;

  axios
    .get(`http://${ip}/xmldata?item=all`)
    .then(res => findMACs(parse(res.data)))
    .then(macs => {
      for (let mac of macs) mapping[mac] = iso;
      return macs;
    })
    .then(x => res.json(x));
});

app.get("/creds/:ip", (req, res) => {
  const { ip } = req.params;

  res.json(credentials[ip] || {});
});

app.post("/creds/:ip", jsonParser, (req, res) => {
  const { ip } = req.params;
  const creds = req.body;

  credentials[ip] = creds;
  writeFileSync("../config/credentials.json", JSON.stringify(credentials));

  res.status(200).send();
});

app.get("/pixiecore/v1/boot/:mac", ({ params: { mac } }, res) => {
  const selfIP = address();

  const pxeScriptFile = tempfile();
  const isoName =
    mapping[mac.toLowerCase().substring(-1)] ||
    fail("ISO corresponding to MAC not found");
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

  if (!existsSync(kernelFile)) {
    writeFileSync(pxeScriptFile, pxeScript);
    writeFileSync(buildScriptFile, buildScript);
    exec(`chmod +x ${buildScriptFile}`);
    exec(buildScriptFile);
  }

  const response = {
    kernel: `http://${selfIP}:${port}/images/${hash}`
  };

  res.json(response);
});

app.listen(port, () => console.log("PXE server started"));
