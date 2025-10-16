// app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";

const Body = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
        confirm_token: null,
      })
      .eq("email", email);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Non-blocking courtesy email
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || process.env.RESEND_FROM || "The Kandid Edit <no-reply@thekandidedit.com>",
        to: email,
        subject: "You’ve been unsubscribed",
        text: `You've been unsubscribed from The Kandid Edit.\nRe-subscribe anytime at https://www.thekandidedit.com.`,
        html: `
          <table style="max-width:560px;margin:0 auto;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#111;">
            <tr><td style="padding:24px 0;">
              <h1 style="margin:0 0 8px;font-size:20px;">You're unsubscribed</h1>
              <p style="margin:0 0 16px;line-height:1.6;">You've been removed from our list.</p>
              <p style="margin:0 0 20px;">
                <a href="https://www.thekandidedit.com" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;">
                  Re-subscribe
                </a>
              </p>
            </td></tr>
          </table>
        `,
      });
    } catch {}

    return NextResponse.json({ ok: true, message: "Unsubscribed successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}