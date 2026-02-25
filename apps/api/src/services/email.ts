import nodemailer from "nodemailer";
import { Resend } from "resend";

const SMTP_URL = process.env.SMTP_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "ResumeFlow <noreply@resumeflow.app>";
const RESEND_FROM = process.env.RESEND_FROM ?? process.env.EMAIL_FROM ?? "ResumeFlow <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

let transporter: nodemailer.Transporter | null = null;
let resend: Resend | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_URL) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_URL);
  }
  return transporter;
}

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
}

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY || SMTP_URL);
}

export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  const verifyUrl = `${APP_URL.replace(/\/$/, "")}/auth/verify-email?token=${encodeURIComponent(token)}`;
  const text = `Click the link below to verify your email:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`;
  const html = `<p>Click the link below to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`;

  const resendClient = getResend();
  if (resendClient) {
    try {
      const { error } = await resendClient.emails.send({
        from: RESEND_FROM,
        to: [to],
        subject: "Verify your ResumeFlow account",
        text,
        html,
      });
      if (error) {
        console.error("Resend send verification email failed:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Resend send verification email failed:", err);
      return false;
    }
  }

  const transport = getTransporter();
  if (!transport) return false;
  try {
    await transport.sendMail({
      from: EMAIL_FROM,
      to,
      subject: "Verify your ResumeFlow account",
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("Send verification email failed:", err);
    return false;
  }
}
