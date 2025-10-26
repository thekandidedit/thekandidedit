// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/** Absolute base URL for this deployment */
const DEPLOY_URL =
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "https://thekandidedit.com";

/** Fallback social image (1200×630) */
const ogImage = `${DEPLOY_URL}/og-default.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(DEPLOY_URL),
  title: {
    default: "The Kandid Edit",
    template: "%s | The Kandid Edit",
  },
  description: "Where honest stories meet sharp design.",
  alternates: {
    canonical: DEPLOY_URL,
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "The Kandid Edit RSS Feed" }],
    },
  },
  openGraph: {
    title: "The Kandid Edit",
    description: "Where honest stories meet sharp design.",
    url: DEPLOY_URL,
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
        {/* Inline social fallbacks so static HTML includes them */}
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