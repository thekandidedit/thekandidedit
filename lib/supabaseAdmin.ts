// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

// --- env -------------------------------------------------------
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE!;

// --- clients ---------------------------------------------------
// Public client (RLS enforced) — use in server components / edge / browser
export const supabaseAnon = createClient(URL, ANON, {
  auth: { persistSession: false },
});

// Admin client (bypasses RLS) — **server-only** usage like API routes
export const supabaseAdmin = createClient(URL, SERVICE, {
  auth: { persistSession: false },
});