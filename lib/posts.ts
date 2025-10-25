// lib/posts.ts
import { supabaseAnon } from "@/lib/supabaseAdmin"; // if you only have supabaseAdmin, import that
// If you don't have supabaseAnon, just replace it with `supabaseAdmin` here and below.

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export async function listPublishedPosts() {
  const { data, error } = await supabaseAnon
    .from("posts")
    .select("id,title,slug,excerpt,cover_image_url,created_at,updated_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Post[];
}

export async function getPostBySlug(slug: string) {
  const { data, error } = await supabaseAnon
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) throw error;
  return data as Post;
}