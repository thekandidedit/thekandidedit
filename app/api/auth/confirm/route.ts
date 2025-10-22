// app/api/auth/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyEmailToken } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  try {
    const payload = verifyEmailToken(token);
    const email = payload?.email as string | undefined;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ status: "active", confirm_token: null })
      .eq("email", email);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "";
    const redirectUrl = `${base.replace(/\/+$/, "")}/auth/confirm?status=ok&email=${encodeURIComponent(email)}`;

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}