// Requires a verified session. Never returns phone numbers.
const { requireSession } = require("./_lib/session");
const { listProfiles } = require("./_lib/store");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const session = requireSession(req, res);
  if (!session) return;

  const ageMin = Math.max(18, parseInt(req.query.ageMin, 10) || 18);
  const ageMax = Math.min(100, parseInt(req.query.ageMax, 10) || 100);
  const gender = String(req.query.gender || "any").toLowerCase();

  const all = await listProfiles();

  const result = all
    .filter((p) => p.phone !== session.phone)
    .filter((p) => p.age >= ageMin && p.age <= ageMax)
    .filter((p) => gender === "any" || p.gender === gender)
    .map((p) => ({ name: p.name, age: p.age, gender: p.gender, photoUrl: p.photoUrl }));

  return res.status(200).json(result);
};
