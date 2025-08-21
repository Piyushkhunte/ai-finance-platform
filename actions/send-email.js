"use server";

import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  const resend = new Resend(process.env.RESEND_API_KEY || "");

  try {
    if (Array.isArray(to)) {
      const data = await resend.batch.send(
        to.map((recipient) => ({
          from: "Finance App <onboarding@resend.dev>",
          to: recipient,
          subject,
          react,
        }))
      );
      return { success: true, data };
    }

    const data = await resend.emails.send({
      from: "Finance App <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    return { success: true, data };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return { success: false, error: String(error) };
  }
}
