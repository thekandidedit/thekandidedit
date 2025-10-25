import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.thekandidedit.com";
  const posts = await listPublishedPosts();

  const postUrls = posts.map(p => ({
    url: `${base}/posts/${encodeURIComponent(p.slug)}`,
    lastModified: p.updated_at ?? p.created_at ?? new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/posts`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    ...postUrls,
  ];
}