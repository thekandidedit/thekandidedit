import { NextResponse } from "next/server";

export async function GET() {
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasFrom = !!process.env.RESEND_FROM;
  const hasAppUrl = !!process.env.APP_URL;
  const hasJwt = !!process.env.JWT_SECRET;

  return NextResponse.json({
    ok: true,
    checks: {
      RESEND_API_KEY: hasResendKey,
      RESEND_FROM: hasFrom,
      APP_URL: hasAppUrl,
      JWT_SECRET: hasJwt,
    },
    ts: new Date().toISOString(),
  });
}