// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";
import { signEmailToken } from "@/lib/tokens";

// -------- helpers -----------------------------------------------------------
function cleanBaseUrl(req: NextRequest): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").trim();
  const base = fromEnv || new URL(req.url).origin;
  return base.replace(/\/+$/, ""); // strip trailing slash
}

function fromAddress(): string {
  const configured = (process.env.EMAIL_FROM || process.env.RESEND_FROM || "").trim();
  return configured || `"The Kandid Edit" <onboarding@resend.dev>`;
}

// Strongly typed safe helpers
interface PgError {
  code?: string;
  message: string;
}

interface ResendSendResponse {
  data?: { id?: string | null } | null;
  error?: { message?: string } | null;
}

// -------- schema ------------------------------------------------------------
const Body = z.object({ email: z.string().email() });

// -------- route -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // 1) validate payload
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, where: "validate", error: "Valid email required" },
        { status: 400 }
      );
    }
    const email = parsed.data.email.trim().toLowerCase();

    // 2) insert pending (or re-arm if duplicate & not active)
    const dbToken = crypto.randomBytes(24).toString("hex");
    const { error: insertErr } = await supabaseAdmin
      .from("subscribers")
      .insert({ email, status: "pending", confirm_token: dbToken })
      .select()
      .single();

    if (insertErr) {
      const e = insertErr as PgError;

      // 23505 = unique_violation
      if (e.code === "23505") {
        const { data: upd, error: updErr } = await supabaseAdmin
          .from("subscribers")
          .update({ confirm_token: dbToken, status: "pending" })
          .eq("email", email)
          .neq("status", "active")
          .select();

        if (updErr || !upd || upd.length === 0) {
          return NextResponse.json({
            ok: true,
            alreadyActive: true,
            message: "This email is already subscribed.",
          });
        }
      } else {
        return NextResponse.json(
          { ok: false, where: "db", error: e.message || "Database error" },
          { status: 500 }
        );
      }
    }

    // 3) build links
    const jwt = signEmailToken({ email });
    const base = cleanBaseUrl(req);
    const confirmUrl = `${base}/api/auth/confirm?token=${jwt}`;
    const unsubUrl = `${base}/api/unsubscribe?token=${jwt}`;

    // 4) send message + log (with List-Unsubscribe headers)
    try {
      const from = fromAddress();

      // RFC 2369 + RFC 8058 (One-Click)
      const oneClickUrl = `${base}/api/unsubscribe/one-click`;
      const mailto = `mailto:no-reply@thekandidedit.com?subject=unsubscribe`;

      const sendResp: ResendSendResponse = await resend.emails.send({
        from,
        to: email,
        subject: "Please confirm your subscription",
        text:
          `Hi,\n\n` +
          `Please confirm your subscription to The Kandid Edit by opening this link:\n${confirmUrl}\n\n` +
          `If you didn’t request this, you can ignore this email.\n\n` +
          `To unsubscribe, visit:\n${unsubUrl}\n`,
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
                Or open this link:<br/>
                <a href="${confirmUrl}" style="color:#111;">${confirmUrl}</a>
              </p>
              <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
              <p style="margin:0 0 16px;font-size:12px;color:#666;">
                Don’t want these? <a href="${unsubUrl}" style="color:#111;">Unsubscribe</a>.
              </p>
            </td></tr>
          </table>
        `,
        headers: {
          // Enables the ‘Unsubscribe’ affordance in Gmail/Yahoo and automated one-click POSTs
          "List-Unsubscribe": `<${mailto}>, <${oneClickUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          // Optional but good hygiene
          "Reply-To": "no-reply@thekandidedit.com",
        },
      });

      const resendId = sendResp.data?.id ?? null;
      const status = resendId ? "sent" : "failed";
      const errorMsg = resendId ? null : sendResp.error?.message ?? "unknown";

      await supabaseAdmin.from("email_logs").insert({
        email,
        template: "confirm_subscription",
        status,
        resend_id: resendId,
        error_message: errorMsg,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "send_exception";
      await supabaseAdmin.from("email_logs").insert({
        email,
        template: "confirm_subscription",
        status: "failed",
        error_message: message,
      });
    }

    // 5) success payload (includes confirmUrl for in-page testing)
    return NextResponse.json({ ok: true, sent: true, confirmUrl }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}