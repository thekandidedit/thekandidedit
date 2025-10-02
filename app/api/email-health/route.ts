import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function GET() {
  try {
    const from =
      process.env.EMAIL_FROM || "The Kandid Edit <no-reply@thekandidedit.com>";
    const to = process.env.TEST_EMAIL ?? "thekandidedit@gmail.com";

    const resp = await resend.emails.send({
      from,
      to,
      subject: "Health: Resend from production",
      text: "If you see this, RESEND_API_KEY + domain are working in production.",
    });

    // Handle both possible SDK response shapes
    const id =
      (resp as any)?.id ??
      (resp as any)?.data?.id ??
      null;

    // Helpful one-line log in Vercel "Runtime Logs"
    console.log("[email-health] send response:", JSON.stringify(resp));

    return NextResponse.json({ ok: true, id });
  } catch (e: unknown) {
    console.error("[email-health] error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}