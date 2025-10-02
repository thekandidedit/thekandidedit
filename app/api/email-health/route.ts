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

    // Safely extract ID from both possible response shapes
    const id =
      (resp as { id?: string })?.id ??
      (resp as { data?: { id?: string } })?.data?.id ??
      null;

    console.log("[email-health] send response:", JSON.stringify(resp));

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[email-health] error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}