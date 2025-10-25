// lib/posts.ts
import { supabaseAnon } from "@/lib/supabaseAdmin";

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

export async function listPublishedPosts(): Promise<Post[]> {
  const { data, error } = await supabaseAnon
    .from("posts")
    .select("id,title,slug,excerpt,cover_image_url,created_at,updated_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabaseAnon
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return (data as Post) ?? null;
}