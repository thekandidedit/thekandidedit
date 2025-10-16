// app/api/auth/confirm/route.ts
import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/tokens";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/confirm?status=error", process.env.APP_URL)
      );
    }

    const payload = verifyEmailToken(token);
    const email = payload?.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.redirect(
        new URL("/auth/confirm?status=error", process.env.APP_URL)
      );
    }

    // Persist: mark the subscriber active (unless they unsubscribed)
    // and clear any stored confirm token.
    try {
      const { error } = await supabaseAdmin
        .from("subscribers")
        .update({ status: "active", confirm_token: null })
        .eq("email", email)
        .neq("status", "unsubscribed");

      if (error) {
        // Don’t block the UX; just log for later.
        console.error("[confirm] DB update error:", error.message);
      }
    } catch (dbErr) {
      console.error("[confirm] DB update exception:", dbErr);
      // Still continue to success redirect to avoid trapping the user.
    }

    return NextResponse.redirect(
      new URL(
        `/auth/confirm?status=ok&email=${encodeURIComponent(email)}`,
        process.env.APP_URL
      )
    );
  } catch (err) {
    console.error("Confirm route error:", err);
    return NextResponse.redirect(
      new URL("/auth/confirm?status=error", process.env.APP_URL)
    );
  }
}