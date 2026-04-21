import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
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
};

export default nextConfig;
