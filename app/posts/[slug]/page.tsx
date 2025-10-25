// app/posts/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchPostBySlug } from "@/lib/posts";

export const revalidate = 60; // ISR

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPostBySlug(params.slug);
  if (!post) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-white" style={{ background: "#0b0b0b", minHeight: "100vh" }}>
      <article className="prose-invert prose-kandid">
        <Link href="/posts" className="no-underline text-sm opacity-70 hover:opacity-100">← Back to posts</Link>
        <h1 className="!mb-2">{post.title}</h1>
        <p className="!mt-0 opacity-70 text-sm">
          {new Date(post.created_at).toLocaleDateString()}
        </p>

        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt=""
            className="rounded-xl border border-white/10 my-6"
          />
        ) : null}

        {/* Basic rendering for now. If content has markdown/HTML later, we’ll switch to a renderer */}
        {post.content ? (
          <div className="whitespace-pre-wrap leading-7 opacity-95">
            {post.content}
          </div>
        ) : (
          <p className="opacity-80">No content yet.</p>
        )}
      </article>
    </main>
  );
}