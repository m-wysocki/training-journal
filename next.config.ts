import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: projectRoot,
  },
  async redirects() {
    return [
      {
        source: "/muscle-groups",
        destination: "/exercise-categories",
        permanent: true,
      },
      {
        source: "/muscle-groups/:path*",
        destination: "/exercise-categories/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:folder(favicon|favicon-black)/site.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source:
          "/:folder(favicon|favicon-black)/:icon(favicon.ico|favicon.svg|favicon-96x96.png|apple-touch-icon.png|web-app-manifest-192x192.png|web-app-manifest-512x512.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
