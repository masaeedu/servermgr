import express from "express";
import { exec } from "shelljs";
import { address } from "ip";
import bodyParser from "body-parser";
import { file as tempfile } from "tempy";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import md5 from "md5";
import cors from "cors";

import { discoverBMCs, remote, fail, parseTable, parseDict } from "./utils";

import mapping from "../config/mapping";
import credentials from "../config/credentials";

const imgPath = "/tmp/images";
const ipxeSrcLocation = "/media/ankh/data/depot/git/ipxe/src";

const app = express();

const jsonParser = bodyParser.json();

app.use("/images", express.static(imgPath));
app.use(cors());

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

app.post("/bmc/:ip/power", jsonParser, (req, res) => {
  const { ip } = req.params;
  const { on, bootmode } = req.body;

  const conn = getConn(ip);
  conn(`chassis power ${on ? "on" : "off"}`);
  res.status(200).send();
});

app.get("/pixiecore/v1/boot/:mac", ({ params: { mac } }, res) => {
  const selfIP = address();

  const pxeScriptFile = tempfile();
  const isoName =
    mapping[mac.toLowerCase()] || fail("ISO corresponding to MAC not found");
  const pxeScript = `#!ipxe
dhcp && sanboot http://${selfIP}/images/${isoName}
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
    console.log("Building");

    writeFileSync(pxeScriptFile, pxeScript);
    writeFileSync(buildScriptFile, buildScript);
    exec(`chmod +x ${buildScriptFile}`);
    exec(buildScriptFile);
  }

  const response = {
    kernel: `http://${selfIP}/images/${hash}`
  };

  console.log(response);
  res.json(response);
});

app.listen(80, () => console.log("PXE server started"));
