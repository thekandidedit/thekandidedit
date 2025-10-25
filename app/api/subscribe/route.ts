// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMail, fromAddress } from "@/lib/resend";
import { signEmailToken } from "@/lib/tokens";

// -------- helpers -----------------------------------------------------------
function cleanBaseUrl(req: NextRequest): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").trim();
  const base = fromEnv || new URL(req.url).origin;
  return base.replace(/\/+$/, ""); // strip trailing slash
}

// -------- types -------------------------------------------------------------
interface PgError {
  code?: string;
  message: string;
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
        { status: 400 },
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
          { status: 500 },
        );
      }
    }

    // 3) build links
    const jwt = signEmailToken({ email });
    const base = cleanBaseUrl(req);
    const confirmUrl = `${base}/api/auth/confirm?token=${jwt}`;
    const unsubUrl = `${base}/api/unsubscribe?token=${jwt}`;

    // 4) send email via sendMail() helper (adds headers automatically)
    await sendMail({
      to: email,
      subject: "Please confirm your subscription",
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
      text: `Please confirm your subscription: ${confirmUrl}`,
      unsubscribeUrl: unsubUrl,
      from: fromAddress(),
    });

    // 5) success payload
    return NextResponse.json({ ok: true, sent: true, confirmUrl }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}