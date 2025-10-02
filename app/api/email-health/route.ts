import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function GET() {
  try {
    const from = process.env.EMAIL_FROM || "The Kandid Edit <no-reply@thekandidedit.com>";
    const to = process.env.TEST_EMAIL ?? "thekandidedit@gmail.com";

    const result = await resend.emails.send({
      from,
      to,
      subject: "Health: Resend from production",
      text: "If you see this, RESEND_API_KEY and domain are working in production.",
    });

    // Instead of `any`, cast result to `Record<string, unknown>`
    const safeResult = result as Record<string, unknown>;

    return NextResponse.json({
      ok: true,
      resultId: safeResult.id ?? null,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}