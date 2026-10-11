const jwt = require("jsonwebtoken");
const COOKIE = "dm_session";
const MAX_AGE = 24 * 60 * 60; // 24 hours, re-verify by phone the next day

function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setSession(res, phone) {
  const token = jwt.sign({ phone }, process.env.SESSION_SECRET, { expiresIn: MAX_AGE });
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`
  );
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

function getSession(req) {
  try {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (!token) return null;
    return jwt.verify(token, process.env.SESSION_SECRET, { algorithms: ["HS256"] });
  } catch (e) {
    return null;
  }
}

function requireSession(req, res) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: "Please verify your phone first" });
    return null;
  }
  return session;
}

module.exports = { setSession, clearSession, getSession, requireSession };
