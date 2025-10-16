// app/api/email-health/route.ts
import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

function fromAddress(): string {
  return (
    (process.env.EMAIL_FROM || process.env.RESEND_FROM || "").trim() ||
    `"The Kandid Edit" <onboarding@resend.dev>`
  );
}

export async function GET(req: Request) {
  try {
    // 1) Require the health token (either header or query param)
    const url = new URL(req.url);
    const headerToken = req.headers.get("x-health-token");
    const queryToken = url.searchParams.get("token");
    const token = headerToken ?? queryToken ?? "";
    if (!process.env.HEALTH_TOKEN || token !== process.env.HEALTH_TOKEN) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2) Prepare "from" and "to"
    const from = fromAddress(); // must be 'Name <no-reply@thekandidedit.com>'
    const to = process.env.TEST_EMAIL ?? "thekandidedit@gmail.com";

    // 3) Send a simple test email
    const resp = await resend.emails.send({
      from,
      to,
      subject: "Health: Resend from production",
      text: "If you see this, RESEND_API_KEY + domain are working in production.",
    });

    // 4) Extract id regardless of SDK shape
    const id =
      (resp as { id?: string })?.id ??
      (resp as { data?: { id?: string } })?.data?.id ??
      null;

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[email-health] error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}