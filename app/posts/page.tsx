// app/posts/page.tsx
import Link from "next/link";
import { fetchPosts } from "@/lib/posts";

export const revalidate = 60; // ISR: refresh list every minute

export default async function PostsPage() {
  const posts = await fetchPosts();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-white" style={{ background: "#0b0b0b", minHeight: "100vh" }}>
      <h1 className="text-3xl font-bold mb-6">Latest posts</h1>

      {posts.length === 0 && (
        <p className="opacity-80">No posts yet. Check back soon.</p>
      )}

      <ul className="space-y-6">
        {posts.map((p) => (
          <li key={p.id} className="border border-white/10 rounded-xl p-5 hover:border-white/20 transition">
            <Link href={`/posts/${p.slug}`} className="block">
              <h2 className="text-xl font-semibold mb-2">{p.title}</h2>
              {p.excerpt && (
                <p className="opacity-80 text-sm">{p.excerpt}</p>
              )}
              <p className="mt-3 text-xs opacity-60">
                {new Date(p.created_at).toLocaleDateString()}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}