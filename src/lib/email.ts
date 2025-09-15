import nodemailer from "nodemailer";

type MailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
};

const host = process.env.SMTP_HOST!;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER!;
const pass = process.env.SMTP_PASS!;
const from = process.env.SMTP_FROM || "StudyBuddy <no-reply@studybuddy.app>";
const appBase = process.env.APP_BASE_URL || "http://localhost:3000";

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // Mailtrap/2525 => false
  auth: { user, pass },
});

export async function sendMail({ to, subject, html, text }: MailInput) {
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP-miljøvariabler mangler (SMTP_HOST/SMTP_USER/SMTP_PASS)."
    );
  }
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: text ?? htmlToText(html),
    html,
  });
  return info.messageId;
}

/**
 * Verifiserings-epost for OTP (brukes ved registrering)
 */
export async function sendOtpEmail(to: string, code: string) {
  const subject = "Din StudyBuddy verifiseringskode";
  const html = baseEmail(`
    <p>Hei!</p>
    <p>Her er din engangskode (OTP):</p>
    <p style="font-size:24px;font-weight:800;letter-spacing:4px;margin:16px 0">${escapeHtml(
      code
    )}</p>
    <p>Koden er gyldig i 10 minutter.</p>
    <p>Hvis du ikke ba om dette, kan du ignorere e-posten.</p>
  `);
  return sendMail({ to, subject, html });
}

/**
 * Glemt passord – send lenke for å resette passordet.
 * Forventer at API-et ditt lager en token (JWT eller random) som valideres i /api/password/reset.
 * Reset-siden antas å være /password/reset?token=...
 */
export async function sendResetEmail(to: string, token: string) {
  const resetUrl = `${appBase}/password/reset?token=${encodeURIComponent(
    token
  )}`;
  const subject = "Tilbakestill passordet ditt";
  const html = baseEmail(`
    <p>Hei!</p>
    <p>Vi mottok en forespørsel om å tilbakestille passordet ditt.</p>
    <p><a href="${resetUrl}" target="_blank" rel="noreferrer" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-weight:800">Tilbakestill passord</a></p>
    <p>Du kan også kopiere og lime inn denne lenken i nettleseren din:</p>
    <p style="word-break:break-all"><a href="${resetUrl}" target="_blank" rel="noreferrer">${resetUrl}</a></p>
    <p>Hvis du ikke ba om dette, kan du ignorere e-posten.</p>
  `);
  return sendMail({ to, subject, html });
}

/**
 * (Valgfritt) Bekreftelse når passord er endret – kan kalles etter vellykket reset
 */
export async function sendPasswordChangedEmail(to: string) {
  const subject = "Passordet ditt er endret";
  const html = baseEmail(`
    <p>Hei!</p>
    <p>Passordet til kontoen din ble nettopp endret. Hvis dette ikke var deg, ta kontakt umiddelbart.</p>
    <p><a href="${appBase}" target="_blank" rel="noreferrer">${appBase}</a></p>
  `);
  return sendMail({ to, subject, html });
}

/* ------------------------ Helpers ------------------------ */

function baseEmail(innerHtml: string) {
  return `
  <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;color:#111;line-height:1.5">
    <div style="margin-bottom:16px">
      <strong style="background:#CDE3F5;color:#0F172A;padding:6px 10px;border-radius:10px">StudyBuddy</strong>
    </div>
    ${innerHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
    <p style="font-size:12px;color:#666">StudyBuddy · <a href="${appBase}" target="_blank" rel="noreferrer">${appBase}</a></p>
  </div>`;
}

function htmlToText(html?: string) {
  if (!html) return undefined;
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
