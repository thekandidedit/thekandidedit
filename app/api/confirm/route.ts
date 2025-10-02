// app/api/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";

export async function GET(req: NextRequest) {
  try {
    // 1) Read token
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing token" },
        { status: 400 }
      );
    }

    // 2) Mark subscriber active and clear token, return the email so we can send
    const { data, error } = await supabaseAdmin
      .from("subscribers")
      .update({ status: "active", confirm_token: null })
      .eq("confirm_token", token)
      .select("email") // only need email
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 400 }
      );
    }

    // 3) Fire-and-forget confirmation email (do not block the response)
    const from =
      process.env.EMAIL_FROM || "The Kandid Edit <no-reply@thekandidedit.com>";

    // The Resend SDK returns { data?: { id: string }, error?: ResendError }
    const { data: sendData, error: sendError } = await resend.emails.send({
      from,
      to: data.email,
      subject: "You're in! 🎉",
      text:
        "Thanks for confirming your subscription to The Kandid Edit.\n" +
        "You'll start getting updates soon.\n\n" +
        "If this wasn't you, you can unsubscribe anytime from the footer of any email.",
      html: `
        <table style="max-width:560px;margin:0 auto;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111;">
          <tr><td style="padding:24px 0;">
            <h1 style="margin:0 0 12px;font-size:22px;">
              Welcome to <span style="font-weight:600">The Kandid Edit</span> 🎉
            </h1>
            <p style="margin:0 0 8px;line-height:1.6">
              Thanks for confirming your subscription. You'll start getting updates soon.
            </p>
            <p style="margin:16px 0 0;font-size:12px;color:#666">
              If this wasn't you, you can unsubscribe anytime from the footer of any email.
            </p>
          </td></tr>
        </table>
      `,
    });

    if (sendError) {
      // Log but don't fail the confirmation for email send issues
      console.error("[confirm] Resend email error:", sendError);
    } else {
      console.log("[confirm] Resend email sent id:", sendData?.id);
    }

    // 4) Respond to browser
    return NextResponse.json({
      ok: true,
      message: "Subscription confirmed!",
    });
  } catch (e) {
    console.error("[confirm] unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}