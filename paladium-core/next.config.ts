// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // <-- this generates .next/standalone on build
};

export default nextConfig;

