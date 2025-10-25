// app/posts/page.tsx
import Link from "next/link";
import { listPublishedPosts } from "@/lib/posts";

export const revalidate = 60; // ISR

export default async function PostsPage() {
  const posts = await listPublishedPosts();

  return (
    <main className="p-8 prose-kandid" style={{ background: "#0b0b0b", minHeight: "100vh", color: "#fff" }}>
      <h1>Articles</h1>

      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {posts.map((p) => (
            <li key={p.id} style={{ margin: "1.2rem 0" }}>
              <h3 style={{ margin: 0 }}>
                <Link href={`/posts/${p.slug}`}>{p.title}</Link>
              </h3>
              {p.excerpt && (
                <p style={{ margin: "0.25rem 0 0.5rem", color: "#aaa" }}>{p.excerpt}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}