// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";

// 1) Validate body
const Body = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    // ---- 1) Validate input
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, where: "validate", error: "Valid email required" },
        { status: 400 }
      );
    }
    const email = parsed.data.email.toLowerCase().trim();

    // ---- 2) Make token and try to insert a new row as pending
    const token = crypto.randomBytes(24).toString("hex");

    const { error: insertError } = await supabaseAdmin
      .from("subscribers")
      .insert({ email, status: "pending", confirm_token: token })
      .select()
      .single();

    // ---- 2b) If duplicate, update (re-arm) any non-active row
    if (insertError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((insertError as any).code === "23505") {
        const { data: upd, error: updateError } = await supabaseAdmin
          .from("subscribers")
          .update({ confirm_token: token, status: "pending" })
          .eq("email", email)
          .neq("status", "active") // allow resubscribe if unsubscribed or pending
          .select();

        // Already active? then don't send a confirm link (no token to confirm).
        if (updateError || !upd?.length) {
          return NextResponse.json({
            ok: true,
            alreadyActive: true,
            message: "This email is already subscribed.",
          });
        }
      } else {
        return NextResponse.json(
          { ok: false, where: "db", error: insertError.message },
          { status: 500 }
        );
      }
    }

    // ---- 3) Build confirm URL
    const base = process.env.NEXT_PUBLIC_SITE_URL!;
    const confirmUrl = `${base}/api/confirm?token=${token}`;

    // ---- 4) Send email (don’t block API if it fails)
    try {
      const from =
        process.env.EMAIL_FROM || `"The Kandid Edit" <onboarding@resend.dev>`;

      await resend.emails.send({
        from,
        to: email,
        subject: "Please confirm your subscription",
        text:
          `Hi,\n\nPlease confirm your subscription to The Kandid Edit by opening this link:\n` +
          `${confirmUrl}\n\nIf you didn’t request this, you can ignore this email.`,
        html: `
          <table style="max-width:560px;margin:0 auto;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#111;">
            <tr><td style="padding:24px 0;">
              <h1 style="margin:0 0 8px;font-size:20px;">Confirm your subscription</h1>
              <p style="margin:0 0 16px;line-height:1.6;">
                Thanks for subscribing to <strong>The Kandid Edit</strong> 🎉
              </p>
              <p style="margin:0 0 20px;">
                <a href="${confirmUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;">
                  Confirm Subscription
                </a>
              </p>
              <p style="margin:0 0 16px;font-size:12px;color:#666;">
                Or open this link: <br/>
                <a href="${confirmUrl}" style="color:#111;">${confirmUrl}</a>
              </p>
            </td></tr>
          </table>
        `,
      });
    } catch {
      // swallow email errors; API still responds OK
    }

    // ---- 5) Done
    return NextResponse.json({ ok: true, sent: true, confirmUrl }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}