// app/posts/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPostBySlug, listPublishedPosts } from "@/lib/posts";
import { renderPostContent } from "@/lib/mdx";

export const revalidate = 60;
export const dynamic = "force-static";
export const fetchCache = "force-cache";

export async function generateStaticParams() {
  const posts = await listPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

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

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  const safeHtml = await renderPostContent(post.content || post.excerpt || "");

  return (
    <main
      className="mx-auto max-w-3xl px-6 py-12 text-white"
      style={{ background: "#0b0b0b" }}
    >
      <article className="prose prose-invert prose-headings:scroll-mt-24 prose-a:underline-offset-4 prose-img:rounded-xl">
        <Link href="/posts" className="no-underline text-sm opacity-70 hover:opacity-100">
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

        {/* Render sanitized HTML */}
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      </article>
    </main>
  );
}