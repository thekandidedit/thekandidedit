/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/auth/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyEmailToken } from "@/lib/tokens";

function baseUrl(req: NextRequest) {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").trim();
  const base = fromEnv || new URL(req.url).origin;
  return base.replace(/\/+$/, "");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      `${baseUrl(req)}/auth/confirm?status=error&reason=missing_token`
    );
  }

  try {
    // 1) Verify JWT and extract email
    const payload = await verifyEmailToken(token);
    const email = String(payload.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.redirect(
        `${baseUrl(req)}/auth/confirm?status=error&reason=bad_payload`
      );
    }

    // 2) Activate subscriber + token hygiene
    //    - set status=active
    //    - clear confirm_token
    //    - clear unsubscribed_at (in case they’re re-subscribing)
    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          email,
          status: "active",
          confirm_token: null,
          unsubscribed_at: null,
        },
        { onConflict: "email" }
      );

    if (error) {
      return NextResponse.redirect(
        `${baseUrl(req)}/auth/confirm?status=error&reason=db`
      );
    }

    // 3) Done
    return NextResponse.redirect(
      `${baseUrl(req)}/auth/confirm?status=ok&email=${encodeURIComponent(email)}`
    );
  } catch {
    return NextResponse.redirect(
      `${baseUrl(req)}/auth/confirm?status=error&reason=invalid_token`
    );
  }
}