// app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  // Expect JSON: { "email": "someone@example.com" }
  const body = await req.json().catch(() => null);
  const email = body?.email?.toString().trim();

  if (!email) {
    return NextResponse.json(
      { ok: false, where: "validate", error: "Valid email required" },
      { status: 400 }
    );
  }

  // Update status + timestamp
  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("email", email);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Send a courtesy “you’ve been unsubscribed” email (best effort)
  const from = process.env.EMAIL_FROM || "no-reply@thekandidedit.com";
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: "You’ve been unsubscribed",
      text:
        "You have been unsubscribed from The Kandid Edit.\n" +
        "We’re sorry to see you go.",
      html: `
        <table style="max-width:560px;margin:0 auto;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111;">
          <tr>
            <td style="padding:32px 24px">
              <h1 style="margin:0 0 12px;font-size:22px">You’ve been unsubscribed</h1>
              <p style="margin:0 0 8px;line-height:1.6">
                We’re sorry to see you go. You won’t receive further emails from
                <strong>The Kandid Edit</strong>.
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#666">
                If this was a mistake, you can subscribe again anytime from the site.
              </p>
            </td>
          </tr>
        </table>
      `,
    });
  } catch {
    // ignore email errors
  }

  return NextResponse.json({ ok: true, message: "Unsubscribed successfully." });
}