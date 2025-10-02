import { NextResponse } from "next/server";
import { resend } from "@/lib/resend"; // same helper you're already using

export async function GET() {
  try {
    const from = process.env.EMAIL_FROM || "The Kandid Edit <no-reply@thekandidedit.com>";
    const to = process.env.TEST_EMAIL ?? "thekandidedit@gmail.com"; // change if you want

    const result = await resend.emails.send({
      from,
      to,
      subject: "Health: Resend from production",
      text: "If you see this, RESEND_API_KEY + domain are working in production.",
    });

    return NextResponse.json({ ok: true, resultId: result?.id ?? null });
  } catch (e: any) {
    // Return the message so we can see it in the browser/network
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}