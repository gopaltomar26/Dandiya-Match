// Uses Twilio Verify, which generates, sends, and checks the OTP for you —
// so no OTP code is ever generated or stored on our own server.
const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SERVICE = process.env.TWILIO_VERIFY_SERVICE_SID;

function authHeader() {
  return "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64");
}

async function sendOtp(phone) {
  const res = await fetch(`https://verify.twilio.com/v2/Services/${SERVICE}/Verifications`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phone, Channel: "sms" }),
  });
  if (!res.ok) throw new Error("Twilio send failed: " + (await res.text()));
  return res.json();
}

async function checkOtp(phone, code) {
  const res = await fetch(`https://verify.twilio.com/v2/Services/${SERVICE}/VerificationCheck`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phone, Code: code }),
  });
  if (!res.ok) return { approved: false };
  const data = await res.json();
  return { approved: data.status === "approved" };
}

module.exports = { sendOtp, checkOtp };
