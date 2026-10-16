import "server-only";

import { Resend } from "resend";
import { readEnv } from "@/lib/env";

export async function sendEmail(input: { to: string; subject: string; text: string; html: string }) {
  const env = readEnv();
  if (!env.resendApiKey) return { sent: false as const, reason: "RESEND_API_KEY is not set" };
  const resend = new Resend(env.resendApiKey);
  const { error } = await resend.emails.send({
    from: env.resendFrom,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  if (error) return { sent: false as const, reason: error.message };
  return { sent: true as const };
}
