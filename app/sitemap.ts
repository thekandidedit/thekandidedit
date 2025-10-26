// app/sitemap.ts
import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/posts";

const siteUrl =
  (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://thekandidedit.com")
    .replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const posts = await listPublishedPosts();
    for (const p of posts) {
      items.push({
        url: `${siteUrl}/posts/${p.slug}`,
        lastModified: new Date(p.updated_at || p.created_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // If Supabase fails, still return base routes so sitemap doesn't break deploys
  }

  return items;
}