// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";
import { signEmailToken } from "@/lib/tokens";

// --- helpers ---------------------------------------------------------------
function cleanBaseUrl(req: NextRequest): string {
  const fromEnv =
    (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").trim();
  const base = fromEnv || new URL(req.url).origin; // fallback to request origin
  return base.replace(/\/+$/, ""); // remove trailing slash
}

function fromAddress(): string {
  return (
    (process.env.EMAIL_FROM || process.env.RESEND_FROM || "").trim() ||
    `"The Kandid Edit" <onboarding@resend.dev>`
  );
}

// --- schema ----------------------------------------------------------------
const Body = z.object({ email: z.string().email() });

// --- route -----------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // 1) Validate email
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, where: "validate", error: "Valid email required" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();

    // 2) Insert or re-arm existing subscriber
    const dbToken = crypto.randomBytes(24).toString("hex");
    const { error: insertError } = await supabaseAdmin
      .from("subscribers")
      .insert({ email, status: "pending", confirm_token: dbToken })
      .select()
      .single();

    if (insertError) {
      // Handle duplicate (already subscribed) emails
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((insertError as any).code === "23505") {
        const { data: upd, error: updateError } = await supabaseAdmin
          .from("subscribers")
          .update({ confirm_token: dbToken, status: "pending" })
          .eq("email", email)
          .neq("status", "active")
          .select();

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

    // 3) Build confirmation link
    const jwt = signEmailToken({ email });
    const confirmUrl = `${cleanBaseUrl(req)}/api/auth/confirm?token=${jwt}`;

    // 4) Send email (non-blocking if it fails)
    try {
      const from = fromAddress();
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
              <p style="margin:0 0 16px;font-size:12px;color:#666;word-break:break-all;">
                Or open this link: <br/>
                <a href="${confirmUrl}" style="color:#111;">${confirmUrl}</a>
              </p>
            </td></tr>
          </table>
        `,
      });
    } catch {
      // Swallow send errors — UI will still show test link
    }

    // 5) Return success with test link
    return NextResponse.json({ ok: true, sent: true, confirmUrl }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}