const { getPending, deletePending, saveProfile } = require("./_lib/store");
const { checkOtp } = require("./_lib/twilio");
const { setSession } = require("./_lib/session");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { phone, code } = req.body || {};
  if (!phone || !/^\d{4,8}$/.test(String(code || ""))) {
    return res.status(400).json({ error: "Enter the code you received" });
  }

  const { approved } = await checkOtp(phone, String(code));
  if (!approved) return res.status(400).json({ error: "Wrong or expired code" });

  const pending = await getPending(phone);
  if (!pending) {
    return res.status(400).json({ error: "Registration expired. Please fill the form again." });
  }

  await saveProfile(phone, { ...pending, createdAt: Date.now() });
  await deletePending(phone);

  setSession(res, phone);
  return res.status(200).json({ ok: true });
};
