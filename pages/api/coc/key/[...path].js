// pages/api/coc/[...path].js
// Proxy utama Clash of Clans API

export default async function handler(req, res) {
  const API_KEY = process.env.COC_API_KEY; // simpan token asli di Vercel
  if (!API_KEY) {
    return res.status(500).json({ error: "COC_API_KEY belum di set di Vercel" });
  }

  const BASE_URL = "https://api.clashofclans.com/v1";
  const path = req.query.path
    ? Array.isArray(req.query.path)
      ? req.query.path.join("/")
      : req.query.path
    : "";

  const query =
    req.url && req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const url = `${BASE_URL}/${path}${query}`;

  try {
    const r = await fetch(url, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
        ...(req.headers["content-type"]
          ? { "Content-Type": req.headers["content-type"] }
          : {}),
      },
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : req.body && Object.keys(req.body).length
        ? JSON.stringify(req.body)
        : undefined,
    });

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
    return res
      .status(500)
      .json({ error: "Proxy error", details: err.message });
  }
}
