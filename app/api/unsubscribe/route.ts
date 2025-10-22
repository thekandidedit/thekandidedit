/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyEmailToken } from "@/lib/tokens";

const Body = z.object({ email: z.string().email() });

function baseUrl(req: NextRequest) {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").trim();
  const base = fromEnv || new URL(req.url).origin;
  return base.replace(/\/+$/, "");
}

async function markUnsubscribed(email: string) {
  return supabaseAdmin
    .from("subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
      confirm_token: null, // hygiene: clear any left-over token
    })
    .eq("email", email)
    .select("id")
    .maybeSingle();
}

// ------------------------
// GET /api/unsubscribe?token=...
// (used from email links)
// ------------------------
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      `${baseUrl(req)}/unsubscribe?status=error&reason=missing_token`
    );
  }

  try {
    const payload = await verifyEmailToken(token);
    const email = String(payload.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.redirect(
        `${baseUrl(req)}/unsubscribe?status=error&reason=bad_payload`
      );
    }

    const { error } = await markUnsubscribed(email);
    if (error) {
      return NextResponse.redirect(
        `${baseUrl(req)}/unsubscribe?status=error&reason=db`
      );
    }

    return NextResponse.redirect(
      `${baseUrl(req)}/unsubscribe?status=ok&email=${encodeURIComponent(email)}`
    );
  } catch {
    return NextResponse.redirect(
      `${baseUrl(req)}/unsubscribe?status=error&reason=invalid_token`
    );
  }
}

// ------------------------
// POST /api/unsubscribe
// { "email": "you@example.com" }
// (used by the on-page form)
// ------------------------
export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Valid email required" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();

    const { error } = await markUnsubscribed(email);
    if (error) {
      return NextResponse.json(
        { ok: false, where: "db", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}