import type { NextConfig } from "next";

/* Static export: `npm run build` writes plain HTML/CSS/JS to out/, hostable anywhere
   (GitHub Pages, Cloudflare Pages, Firebase Hosting, Vercel).
   NEXT_PUBLIC_BASE_PATH is "/fbc-website" for magnumsolis.github.io/fbc-website, "" on a custom domain. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
