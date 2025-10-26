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

// Fetch all published posts for feeds or lists
export async function listPublishedPosts(): Promise<Post[]> {
  const { data, error } = await supabaseAnon
    .from("posts")
    .select("id,title,slug,excerpt,cover_image_url,created_at,updated_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Post[];
}

// Fetch single post by slug
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

// For RSS feed or sitemaps
export async function getAllPosts() {
  const posts = await listPublishedPosts();

  // Return in RSS-friendly shape
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? "",
    date: p.updated_at || p.created_at,
  }));
}