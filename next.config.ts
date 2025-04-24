import type { NextConfig } from "next";
// import withRspack from "next-rspack";

const nextConfig: NextConfig = {
  transpilePackages: ["@electric-sql/pglite", "@electric-sql/pglite-react"],
  // serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
