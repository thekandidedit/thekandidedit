// app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyEmailToken } from "@/lib/tokens";

// small helper so we can set the timestamp in one place
function nowIso() {
  return new Date().toISOString();
}

// shared DB operation
async function markUnsubscribed(email: string) {
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: nowIso(), confirm_token: null })
    .eq("email", email)
    .neq("status", "unsubscribed")
    .select("id, email, status, unsubscribed_at")
    .maybeSingle();

  return { data, error };
}

/**
 * GET /api/unsubscribe?token=JWT
 * - This is what the email "Unsubscribe" link will hit.
 * - We verify the JWT → extract the email → mark as unsubscribed.
 * - Returns a tiny HTML page so it looks nice in the browser.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new NextResponse("Missing token", { status: 400 });
    }

    let email: string;
    try {
      const payload = verifyEmailToken(token);
      email = payload.email.toLowerCase().trim();
    } catch {
      return new NextResponse("Invalid or expired token", { status: 400 });
    }

    const { error } = await markUnsubscribed(email);
    if (error) {
      return new NextResponse(`Database error: ${error.message}`, { status: 500 });
    }

    // simple success page (kept minimal until we style later)
    const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Unsubscribed</title>
<body style="background:#0b0b0b;color:#fff;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:32px">
  <h1 style="margin:0 0 12px">You’re unsubscribed</h1>
  <p style="opacity:.8">We’ve stopped emails to <strong>${email}</strong>. You can close this tab.</p>
</body>
</html>`;
    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/unsubscribe
 * Body: { email: string }
 * - Used by your /unsubscribe page’s form.
 */
const Body = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const { error } = await markUnsubscribed(email);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}