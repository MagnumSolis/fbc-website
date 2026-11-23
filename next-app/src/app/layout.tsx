import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Effects } from "@/components/Effects";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/providers";
import "./globals.css";

// Fonts are downloaded at build time and self-hosted (no request to Google from visitors).
const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://magnumsolis.github.io/fbc-website/";
const description = "A student startup community at BITS Pilani. Find a co-founder, join a startup, validate your idea, and pitch. Free for every BITSian.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "FBC · Founders and Builders Collective · BITS Pilani", template: "%s · FBC" },
  description,
  icons: { icon: "favicon.png", apple: "apple-touch-icon.png" },
  openGraph: {
    type: "website", siteName: "Founders and Builders Collective", url: SITE,
    title: "FBC · Find the people to build it with", description,
    images: [{ url: "og.jpg", width: 1200, height: 630, alt: "FBC: Find the people to build it with." }],
  },
  twitter: { card: "summary_large_image", title: "FBC · Find the people to build it with", description, images: ["og.jpg"] },
};
export const viewport: Viewport = { themeColor: "#0B0B0C" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <div className="blobs" aria-hidden="true"><i /><i /><i /></div>
        <div className="arc" aria-hidden="true" />
        <Providers>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
          <Effects />
        </Providers>
      </body>
    </html>
  );
}
