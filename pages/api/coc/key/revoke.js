// pages/api/coc/revoke.js
import fs from "fs";
import path from "path";
const DATA_FILE = path.join(process.cwd(), "data", "tokens.json");

function readData() { return JSON.parse(fs.readFileSync(DATA_FILE,"utf8")); }
function writeData(d){ fs.writeFileSync(DATA_FILE, JSON.stringify(d,null,2)); }

export default function handler(req, res) {
  const secret = req.headers["x-secret"] || req.query.s || "";
  if (!process.env.GEN_SECRET) return res.status(500).json({ error: "GEN_SECRET not set" });
  if (secret !== process.env.GEN_SECRET) return res.status(403).json({ error: "Forbidden" });

  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const token = (req.body && req.body.token) || req.query.token;
  if (!token) return res.status(400).json({ error: "token required" });

  const data = readData();
  const t = data.tokens.find(x => x.token === token);
  if (!t) return res.status(404).json({ error: "token not found" });

  t.revoked = true;
  writeData(data);
  return res.json({ ok: true, token });
}
