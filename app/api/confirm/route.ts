// app/api/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  // Mark the subscriber active & clear the token
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .update({ status: "active", confirm_token: null })
    .eq("confirm_token", token)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });
  }

  // Send the “confirmed” email (don’t block success if email fails)
  const from = process.env.EMAIL_FROM || "no-reply@thekandidedit.com";
  try {
    await resend.emails.send({
      from,
      to: data.email,
      subject: "You’re in! 🎉",
      text:
        "Thanks for confirming your subscription to The Kandid Edit.\n" +
        "We’re glad you’re here!",
      html: `
        <table style="max-width:560px;margin:0 auto;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111;">
          <tr>
            <td style="padding:32px 24px">
              <h1 style="margin:0 0 12px;font-size:22px">Welcome to <span style="font-weight:600">The Kandid Edit</span> 🎉</h1>
              <p style="margin:0 0 8px;line-height:1.6">
                Thanks for confirming your subscription. You’ll start getting updates soon.
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#666">
                If this wasn’t you, you can unsubscribe anytime from the footer of any email.
              </p>
            </td>
          </tr>
        </table>
      `,
    });
  } catch {
    // swallow email errors – confirmation still succeeded
  }

  return NextResponse.json({ ok: true, message: "Subscription confirmed!" });
}