// app/api/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";

export async function GET(req: NextRequest) {
  // 1) Read token from query string
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  // 2) Set subscriber active and clear the token; select email so we can email them
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .update({ status: "active", confirm_token: null })
    .eq("confirm_token", token)
    .select("email")
    .maybeSingle();

  if (error) {
    console.error("[confirm] supabase error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    // No row matched this token
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });
  }

  // 3) Send confirmation email (await so we see errors in logs)
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "The Kandid Edit <no-reply@thekandidedit.com>",
      to: data.email,
      subject: "You're in! 🎉",
      html: `
        <table style="max-width:560px;margin:0 auto;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111;">
          <tr><td style="padding:24px 0">
            <h1 style="margin:0 0 12px;font-size:22px;">
              Welcome to <span style="font-weight:600;">The Kandid Edit</span> 🎉
            </h1>
            <p style="margin:0 0 8px;line-height:1.6">
              Thanks for confirming your subscription. You'll start getting updates soon.
            </p>
            <p style="margin:16px 0 0;font-size:12px;color:#666;">
              If this wasn't you, you can unsubscribe anytime from the footer of any email.
            </p>
          </td></tr>
        </table>
      `,
    });

    // Helpful deploy-time logging (visible in Vercel “Functions” logs)
    console.log("[confirm] resend accepted, id:", (result as any)?.id);
  } catch (e) {
    // We still return 200 to the browser (their subscription is confirmed),
    // but we log the email failure so you can investigate.
    console.error("[confirm] resend email error:", e);
  }

  // 4) Respond to the browser
  return NextResponse.json({ ok: true, message: "Subscription confirmed!" });
}