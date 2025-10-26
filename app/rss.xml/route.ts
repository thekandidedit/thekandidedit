import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/posts"; // or your existing posts util

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thekandidedit.com";

export async function GET() {
  const posts = await getAllPosts(); // [{ slug, title, excerpt, date }]
  const items = posts
    .map(
      (post) => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${SITE_URL}/posts/${post.slug}</link>
        <guid>${SITE_URL}/posts/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description><![CDATA[${post.excerpt || ""}]]></description>
      </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>The Kandid Edit</title>
      <link>${SITE_URL}</link>
      <description>Unfiltered commentary and creative analysis by The Kandid Edit.</description>
      <language>en</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      ${items}
    </channel>
  </rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}