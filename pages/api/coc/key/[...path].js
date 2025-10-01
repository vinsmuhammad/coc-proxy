// pages/api/coc/[...path].js
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

async function validateClientToken(clientToken) {
  if (!clientToken) return false;
  const data = readData();
  const rec = data.tokens.find(t => t.token === clientToken);
  if (!rec) return false;
  if (rec.revoked) return false;
  if (rec.expiresAt && Date.now() > rec.expiresAt) return false;
  return true;
}

export default async function handler(req, res) {
  // 1. Cek header x-api-key
  const clientToken = req.headers["x-api-key"] || req.query.apikey || null;

  // If you want to allow calls without client token (public), set allowPublic = true
  const allowPublic = false;

  if (!allowPublic) {
    const ok = await validateClientToken(clientToken);
    if (!ok) return res.status(401).json({ error: "Invalid or missing client token (x-api-key)" });
  }

  const API_KEY = process.env.COC_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "COC_API_KEY not configured" });

  // build target URL
  const BASE_URL = "https://api.clashofclans.com/v1";
  const pathParts = req.query.path || [];
  const pathStr = Array.isArray(pathParts) ? pathParts.join("/") : pathParts;
  const query = req.url && req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const url = `${BASE_URL}/${pathStr}${query}`;

  try {
    const fetchOpts = {
      method: req.method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
      // body
      body: ["GET","HEAD"].includes(req.method) ? undefined : req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : undefined,
    };

    const r = await fetch(url, fetchOpts);
    const contentType = r.headers.get("content-type") || "";
    res.status(r.status);
    if (contentType.includes("application/json")) {
      const json = await r.json();
      return res.json(json);
    } else {
      const text = await r.text();
      return res.send(text);
    }
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy error", details: err.message });
  }
}
