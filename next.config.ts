import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
