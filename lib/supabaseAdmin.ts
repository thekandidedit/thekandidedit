import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE!; // server only

export const supabaseAdmin = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});