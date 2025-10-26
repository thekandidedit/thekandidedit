// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

/**
 * We always want OG/Twitter/canonical URLs to use the production host (www),
 * so scrapers don’t hit redirects. For preview deployments, we still set
 * metadataBase to the preview origin so Next.js resolves relative links.
 */
const PROD_ORIGIN =
  (process.env.NEXT_PUBLIC_SITE_URL?.trim() as string | undefined) ||
  "https://www.thekandidedit.com";

const PREVIEW_ORIGIN =
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : PROD_ORIGIN;

/** Fallback social image (1200×630) served from the production host */
const ogImage = `${PROD_ORIGIN}/og-default.jpg`;

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  // Use preview origin for resolving relative links during previews
  metadataBase: new URL(PREVIEW_ORIGIN),

  title: {
    default: "The Kandid Edit",
    template: "%s | The Kandid Edit",
  },
  description: "Where honest stories meet sharp design.",

  // Canonical should point to production host
  alternates: {
    canonical: PROD_ORIGIN,
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "The Kandid Edit RSS Feed" }],
    },
  },

  openGraph: {
    title: "The Kandid Edit",
    description: "Where honest stories meet sharp design.",
    url: PROD_ORIGIN,
    siteName: "The Kandid Edit",
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "The Kandid Edit" }],
  },

  twitter: {
    card: "summary_large_image",
    title: "The Kandid Edit",
    description: "Where honest stories meet sharp design.",
    images: [ogImage],
  },

  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          href="/rss.xml"
          title="The Kandid Edit RSS Feed"
        />
        {/* Inline OG/Twitter fallbacks so static HTML contains them */}
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:image" content={ogImage} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}