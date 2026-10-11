const { put } = require("@vercel/blob");
const { savePending } = require("./_lib/store");
const { sendOtp } = require("./_lib/twilio");

const GENDERS = ["male", "female", "other"];

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return "+91" + digits; // default to India
  return null;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, age, gender, phone, photoDataUrl } = req.body || {};

  const cleanName = String(name || "").trim().slice(0, 60);
  const ageNum = Number(age);
  const cleanGender = String(gender || "").toLowerCase();
  const normPhone = normalizePhone(phone);

  if (!cleanName) return res.status(400).json({ error: "Name is required" });
  if (!Number.isInteger(ageNum) || ageNum < 18 || ageNum > 100) {
    return res.status(400).json({ error: "Age must be between 18 and 100" });
  }
  if (!GENDERS.includes(cleanGender)) return res.status(400).json({ error: "Invalid gender" });
  if (!normPhone) return res.status(400).json({ error: "Enter a valid phone number" });
  if (typeof photoDataUrl !== "string" || !photoDataUrl.startsWith("data:image/")) {
    return res.status(400).json({ error: "Please upload a photo" });
  }

  // data:image/jpeg;base64,xxxx  -> Buffer.  2MB cap keeps requests fast and cheap.
  const base64 = photoDataUrl.split(",")[1] || "";
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > 2 * 1024 * 1024) {
    return res.status(400).json({ error: "Photo is too large" });
  }

  let photoUrl;
  try {
    const blob = await put(`photos/${Date.now()}-${normPhone.replace("+", "")}.jpg`, buffer, {
      access: "public",
      contentType: "image/jpeg",
    });
    photoUrl = blob.url;
  } catch (e) {
    return res.status(500).json({ error: "Could not upload photo" });
  }

  await savePending(normPhone, { name: cleanName, age: ageNum, gender: cleanGender, photoUrl });

  try {
    await sendOtp(normPhone);
  } catch (e) {
    return res.status(502).json({ error: "Could not send the verification code. Check the number and try again." });
  }

  return res.status(200).json({ ok: true, phone: normPhone });
};
