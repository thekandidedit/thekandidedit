// app/posts/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPostBySlug, listPublishedPosts } from "@/lib/posts";

export const revalidate = 60;           // ISR window
export const dynamic = "force-static";  // build-time HTML + cache
export const fetchCache = "force-cache";

// Pre-build all posts at deploy time
export async function generateStaticParams() {
  const posts = await listPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

// -- metadata ---------------------------------------------------------------
// Small helper: base site URL from env or request origin fallback (at runtime
// this will still produce correct absolute URLs on Vercel).
function baseUrl() {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").trim();
  return fromEnv || "https://thekandidedit.com";
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  const url = `${baseUrl()}/posts/${post.slug}`;
  const title = post.title || "Post";
  const description =
    post.excerpt || (post.content ?? "").slice(0, 140) || "The Kandid Edit";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

// -- page -------------------------------------------------------------------
type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params; // params are a Promise in the typed helper we used
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  return (
    <main
      className="mx-auto max-w-3xl px-6 py-12 text-white"
      style={{ background: "#0b0b0b" }}
    >
      <article className="prose-invert prose-kandid">
        <Link
          href="/posts"
          className="no-underline text-sm opacity-70 hover:opacity-100"
        >
          ← Back to posts
        </Link>

        <h1 className="mb-2">{post.title}</h1>
        <p className="mt-0 opacity-70 text-sm">
          {new Date(post.created_at).toLocaleDateString()}
        </p>

        {post.cover_image_url ? (
          <div className="my-6">
            <Image
              src={post.cover_image_url}
              alt={post.title || ""}
              width={1200}
              height={630}
              className="rounded-xl border border-white/10 h-auto w-full"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        ) : null}

        {post.content ? (
          <div className="whitespace-pre-wrap leading-7 opacity-95">
            {post.content}
          </div>
        ) : post.excerpt ? (
          <p className="opacity-80">{post.excerpt}</p>
        ) : (
          <p className="opacity-80">No content yet.</p>
        )}
      </article>
    </main>
  );
}