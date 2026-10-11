// Lets the frontend check "am I already verified?" on page load.
const { getSession } = require("./_lib/session");

module.exports = async (req, res) => {
  const session = getSession(req);
  return res.status(200).json({ signedIn: !!session });
};
