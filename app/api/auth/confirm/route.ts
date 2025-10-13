// app/api/auth/confirm/route.ts
import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/tokens";

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
    if (!payload?.email) {
      return NextResponse.redirect(
        new URL("/auth/confirm?status=error", process.env.APP_URL)
      );
    }

    // mark confirmed in DB here if/when you add persistence

    return NextResponse.redirect(
      new URL(
        `/auth/confirm?status=ok&email=${encodeURIComponent(payload.email)}`,
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