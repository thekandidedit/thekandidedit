// app/posts/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Posts",
  description: "All published posts from The Kandid Edit.",
};

// ISR + cache behavior (same rhythm as detail page)
export const revalidate = 60;            // rebuild page at most once per minute
export const dynamic = "force-static";   // pre-render + serve from cache
export const fetchCache = "force-cache";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function PostsIndexPage() {
  // Server component — runs on the server and can await directly
  const posts = await listPublishedPosts(); // already filters is_published = true

  return (
    <main
      className="mx-auto max-w-4xl px-6 py-12 text-white"
      style={{ background: "#0b0b0b" }}
    >
      <header className="mb-10">
        <h1 className="text-3xl font-bold">Latest posts</h1>
        <p className="opacity-70 mt-2">
          Stories from <strong>The Kandid Edit</strong>.
        </p>
      </header>

      {(!posts || posts.length === 0) && (
        <p className="opacity-70">No posts yet. Check back soon.</p>
      )}

      <ul className="grid gap-6">
        {posts?.map((post) => (
          <li key={post.id} className="border border-white/10 rounded-xl overflow-hidden">
            <Link
              href={`/posts/${post.slug}`}
              className="block hover:bg-white/5 transition-colors"
            >
              {post.cover_image_url && (
                <div className="w-full">
                  <Image
                    src={post.cover_image_url}
                    alt={post.title || ""}
                    width={1200}
                    height={630}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority={false}
                  />
                </div>
              )}

              <div className="p-5">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-sm opacity-70 mt-1">
                  {formatDate(post.created_at)}
                </p>

                {post.excerpt && (
                  <p className="opacity-80 mt-3 line-clamp-3">{post.excerpt}</p>
                )}

                <span className="inline-block mt-4 text-sm underline">
                  Read more →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <footer className="mt-12">
        <Link href="/" className="underline text-sm opacity-80 hover:opacity-100">
          ← Back home
        </Link>
      </footer>
    </main>
  );
}