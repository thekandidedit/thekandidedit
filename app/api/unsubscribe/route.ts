import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyEmailToken } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) throw new Error("Email required");
    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("email", email);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}

// Allow GET for ?token=... from email link
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) throw new Error("Missing token");

    const payload = verifyEmailToken(token);
    const email = payload?.email;
    if (!email) throw new Error("Invalid token");

    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("email", email);

    if (error) throw error;

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL}/unsubscribe?status=ok&email=${encodeURIComponent(email)}`;
    return NextResponse.redirect(redirectUrl, 302);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}