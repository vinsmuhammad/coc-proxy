// pages/api/coc/key.js
// ⚠️ Jangan dipublikasi jika tidak perlu, hanya untuk testing

export default function handler(req, res) {
  const API_KEY = process.env.COC_API_KEY || "";
  if (!API_KEY) return res.status(500).send("COC_API_KEY belum di set");
  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(API_KEY);
}
