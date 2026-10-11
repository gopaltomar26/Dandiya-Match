const { Redis } = require("@upstash/redis");
const { getPending } = require("./_lib/store");
const { sendOtp } = require("./_lib/twilio");

const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: "Missing phone" });

  const pending = await getPending(phone);
  if (!pending) return res.status(400).json({ error: "Registration expired. Please fill the form again." });

  const rlKey = `rl:resend:${phone}`;
  const tries = await redis.incr(rlKey);
  if (tries === 1) await redis.expire(rlKey, 45);
  if (tries > 1) return res.status(429).json({ error: "Please wait a bit before resending" });

  try {
    await sendOtp(phone);
  } catch (e) {
    return res.status(502).json({ error: "Could not resend the code" });
  }
  return res.status(200).json({ ok: true });
};
