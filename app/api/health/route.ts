import { NextResponse } from "next/server";

export async function GET() {
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasFrom = !!process.env.RESEND_FROM;
  const hasApp = !!process.env.APP_URL;
  const hasJwt = !!process.env.JWT_SECRET;

  const ok = hasResendKey && hasFrom && hasApp && hasJwt;

  return NextResponse.json({
    ok,
    checks: {
      RESEND_API_KEY: hasResendKey,
      RESEND_FROM: hasFrom,
      APP_URL: hasApp,
      JWT_SECRET: hasJwt,
    },
    ts: new Date().toISOString(),
  });
}