// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = "https://thekandidedit.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Kandid Edit",
    template: "%s | The Kandid Edit",
  },
  description: "Where honest stories meet sharp design.",
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "The Kandid Edit RSS Feed" }],
    },
  },
  openGraph: {
    title: "The Kandid Edit",
    description: "Where honest stories meet sharp design.",
    url: siteUrl,
    siteName: "The Kandid Edit",
    type: "website",
    images: ["/og-default.jpg"], // 👈 fallback
  },
  twitter: {
    card: "summary_large_image",
    title: "The Kandid Edit",
    description: "Where honest stories meet sharp design.",
    images: ["/og-default.jpg"], // 👈 fallback
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          href="/rss.xml" // 👈 canonical feed URL
          title="The Kandid Edit RSS Feed"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}