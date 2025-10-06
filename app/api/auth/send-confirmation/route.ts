import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import ConfirmEmail from "@/components/emails/confirmEmail"; // <-- match actual filename case
import { signEmailToken } from "@/lib/tokens";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const emailFromQuery = url.searchParams.get("email");
    const { email: emailFromBody } = await req.json().catch(() => ({}));
    const email = (emailFromQuery || emailFromBody || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
    }

    const token = signEmailToken({ email });
    const confirmUrl = `${process.env.APP_URL}/api/auth/confirm?token=${token}`;

    const html = await render(ConfirmEmail({ confirmUrl }));

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM as string,
      to: email,
      subject: "Confirm your email — The Kandid Edit",
      html,
    });

    if (error) {
      console.error("Resend send error:", error);
      return NextResponse.json({ ok: false, error: "SEND_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, messageId: data?.id ?? null });
  } catch (err: any) {
    console.error("send-confirmation error:", err?.message || err);
    return NextResponse.json({ ok: false, error: "SEND_FAILED" }, { status: 500 });
  }
}