// app/posts/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";

export const revalidate = 60; // ISR

type Params = { params: { slug: string } };

export default async function PostPage({ params }: Params) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-white" style={{ background: "#0b0b0b" }}>
      <article className="prose-invert prose-kandid">
        <Link href="/posts" className="no-underline text-sm opacity-70 hover:opacity-100">
          ← Back to posts
        </Link>

        <h1 className="mb-2">{post.title}</h1>
        <p className="mt-0 opacity-70 text-sm">{new Date(post.created_at).toLocaleDateString()}</p>

        {post.cover_image_url ? (
          // keep <img> for simplicity; we can swap to next/image later
          <img
            src={post.cover_image_url}
            alt=""
            className="rounded-xl border border-white/10 my-6"
          />
        ) : null}

        {post.content ? (
          <div className="whitespace-pre-wrap leading-7 opacity-95">{post.content}</div>
        ) : post.excerpt ? (
          <p className="opacity-80">{post.excerpt}</p>
        ) : (
          <p className="opacity-80">No content yet.</p>
        )}
      </article>
    </main>
  );
}