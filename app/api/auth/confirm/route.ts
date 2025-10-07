import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/tokens";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
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

    // ✅ Here, you could mark the email as confirmed in your DB (if you had one)
    console.log("✅ Email confirmed for:", payload.email);

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
  }}