/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import ConfirmEmail from "@/components/emails/confirmEmail";
import { signEmailToken } from "@/lib/tokens";

// Trim and sanitize env vars to prevent trailing space issues
const resend = new Resend((process.env.RESEND_API_KEY || "").trim());
const APP_URL =
  ((process.env.APP_URL || "").trim().replace(/\/+$/, "")) ||
  "https://www.thekandidedit.com";
const RESEND_FROM = (process.env.RESEND_FROM || "").trim();

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const emailFromQuery = url.searchParams.get("email");
    const { email: emailFromBody } = await req.json().catch(() => ({}));
    const email = (emailFromQuery || emailFromBody || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    // Generate the token and confirmation URL
    const token = signEmailToken({ email });
    const confirmUrl = `${APP_URL}/api/auth/confirm?token=${token}`;

    // Render the React email component to HTML
    const html = await render(ConfirmEmail({ confirmUrl }));

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: email,
      subject: "Confirm your email — The Kandid Edit",
      html,
      text: `Confirm your email: ${confirmUrl}`,
    });

    if (error) {
      console.error("Resend send error:", error);
      return NextResponse.json(
        { ok: false, error: "SEND_FAILED", details: error },
        { status: 500 }
      );
    }

    // Success 🎉
    return NextResponse.json({ ok: true, messageId: data?.id ?? null });
  } catch (err: any) {
    console.error("send-confirmation error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "SEND_FAILED", details: err?.message || err },
      { status: 500 }
    );
  }
}