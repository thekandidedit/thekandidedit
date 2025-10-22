// app/api/unsubscribe/one-click/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Gmail/Yahoo One-Click Unsubscribe receiver (RFC 8058).
 * They POST to this URL with the recipient. Different providers send slightly different bodies:
 *  - JSON:       { "recipient": "you@example.com" }
 *  - Form data:  recipient=you%40example.com
 *
 * We accept both. MUST return 200 quickly.
 */
export async function POST(req: NextRequest) {
  try {
    let email: string | undefined;

    // Try JSON first
    try {
      const json = (await req.json().catch(() => ({}))) as { recipient?: string };
      if (json && typeof json.recipient === "string") email = json.recipient.trim().toLowerCase();
    } catch {
      /* ignore */
    }

    // Fallback: urlencoded form
    if (!email) {
      const form = await req.formData().catch(() => null);
      const val = form?.get("recipient");
      if (typeof val === "string") email = val.trim().toLowerCase();
    }

    if (!email) {
      // Some providers may POST without a body—nothing we can do.
      return NextResponse.json({ ok: false, error: "Missing recipient" }, { status: 400 });
    }

    // Unsubscribe silently
    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("email", email);

    if (error) {
      // Still return 200 per spec; mailbox providers just care that we accept.
      console.warn("One-click unsubscribe DB error:", error.message);
      return NextResponse.json({ ok: true, accepted: true });
    }

    return NextResponse.json({ ok: true, accepted: true });
  } catch (err) {
    console.warn("One-click handler error:", err);
    // Return 200 to avoid retries storms
    return NextResponse.json({ ok: true, accepted: true });
  }
}

// (Gmail may occasionally probe via GET; respond 200/OK)
export async function GET() {
  return NextResponse.json({ ok: true });
}