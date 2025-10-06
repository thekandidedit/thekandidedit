import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/tokens";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(`${process.env.APP_URL}/auth/confirm?status=error`);
    }

    const payload = verifyEmailToken(token) as { email?: string };
    const email = (payload?.email || "").toLowerCase();

    // Ensure a row exists (idempotent)
    await supabaseAdmin
      .from("subscribers")
      .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });

    // Mark as confirmed
    await supabaseAdmin
      .from("subscribers")
      .update({ status: "confirmed" })
      .eq("email", email);

    return NextResponse.redirect(
      `${process.env.APP_URL}/auth/confirm?status=ok&email=${encodeURIComponent(email)}`
    );
  } catch (err) {
    console.error("confirm route error:", err);
    return NextResponse.redirect(`${process.env.APP_URL}/auth/confirm?status=error`);
  }
}