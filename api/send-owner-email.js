import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!process.env.API_SECRET || token !== process.env.API_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const {
      caller_name,
      caller_phone,
      caller_email,
      message,
      intent,
      urgency
    } = req.body || {};

    if (!caller_phone || !caller_email || !message || !intent || !urgency) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields"
      });
    }

    const finalName = caller_name || "Unknown";

    const ownerEmail = process.env.OWNER_EMAIL;

    if (!ownerEmail) {
      return res.status(500).json({
        ok: false,
        error: "OWNER_EMAIL missing on server"
      });
    }

    const subject = `Stone Haven Call: ${intent} (${urgency})`;

    const emailBody = `
New call summary from Francesca:

Business: Stone Haven

Caller Name: ${finalName}
Caller Phone: ${caller_phone}
Caller Email: ${caller_email}

Intent: ${intent}
Urgency: ${urgency}

Message:
${message}
    `.trim();

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || "Francesca <send@francescaassistant.com>",
      to: ownerEmail,
      subject,
      text: emailBody
    });

    return res.status(200).json({
      ok: true,
      sent: true,
      result
    });
  } catch (error) {
    console.error("Email send error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to send email"
    });
  }
}
