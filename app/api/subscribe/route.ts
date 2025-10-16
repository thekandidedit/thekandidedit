// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";
import { signEmailToken } from "@/lib/tokens";

function cleanBaseUrl(req: NextRequest): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").trim();
  const base = fromEnv || new URL(req.url).origin;
  return base.replace(/\/+$/, "");
}

function fromAddress(): string {
  return (
    (process.env.EMAIL_FROM || process.env.RESEND_FROM || "").trim() ||
    `"The Kandid Edit" <onboarding@resend.dev>`
  );
}

const Body = z.object({ email: z.string().email() });

type PgError = { code?: string; message: string };
type ResendSendResponse = { data?: { id?: string } | null; error?: { message?: string } | null };

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

    // 2) Insert or update subscriber
    const dbToken = crypto.randomBytes(24).toString("hex");
    const { error: insertError } = await supabaseAdmin
      .from("subscribers")
      .insert({ email, status: "pending", confirm_token: dbToken })
      .select()
      .single();

    if (insertError) {
      const code = (insertError as PgError).code;
      if (typeof code === "string" && code === "23505") {
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
          { ok: false, where: "db", error: (insertError as PgError).message },
          { status: 500 }
        );
      }
    }

    // 3) Build confirmation link
    const jwt = signEmailToken({ email });
    const confirmUrl = `${cleanBaseUrl(req)}/api/auth/confirm?token=${jwt}`;

    // 4) Send email — now with validation and visible errors
    const from = fromAddress();
    const sendResp: ResendSendResponse = await resend.emails.send({
      from,
      to: email,
      subject: "Please confirm your subscription",
      text: `Hi,\n\nPlease confirm your subscription to The Kandid Edit by opening this link:\n${confirmUrl}\n\nIf you didn’t request this, you can ignore this email.`,
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

    // 5) Check if Resend actually succeeded
    const sentId = sendResp?.data?.id;
    if (!sentId) {
      return NextResponse.json(
        {
          ok: false,
          where: "email",
          error: sendResp?.error?.message || "SEND_FAILED",
        },
        { status: 502 }
      );
    }

    // 6) Respond OK
    return NextResponse.json({ ok: true, sent: true, confirmUrl }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}