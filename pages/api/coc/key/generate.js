// pages/api/coc/generate.js
// Protected generator: butuh header x-secret = process.env.GEN_SECRET
// Body (JSON) optional: { "expiresInSec": 3600, "note": "for-whatever" }

import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "tokens.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ tokens: [] }, null, 2));
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function writeData(obj) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
}

export default function handler(req, res) {
  const secret = req.headers["x-secret"] || req.query.s || "";
  if (!process.env.GEN_SECRET) {
    return res.status(500).json({ error: "GEN_SECRET not configured" });
  }
  if (secret !== process.env.GEN_SECRET) {
    return res.status(403).json({ error: "Forbidden: missing/invalid secret" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed, use POST" });
  }

  const body = req.body || {};
  const expiresIn = parseInt(body.expiresInSec || 0, 10); // 0 = never
  const note = body.note || "";

  const token = randomBytes(16).toString("hex"); // 32-char token
  const createdAt = Date.now();
  const expiresAt = expiresIn > 0 ? createdAt + expiresIn * 1000 : null;

  const data = readData();
  data.tokens.push({
    token,
    note,
    createdAt,
    expiresAt,
    revoked: false
    // you can add allowedIPs: [], allowedOrigins: [], scope: [] if needed
  });
  writeData(data);

  res.status(201).json({ token, expiresAt, note });
}
