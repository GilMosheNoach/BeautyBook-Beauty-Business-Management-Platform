import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@node-rs/argon2"],
  // Photo uploads go through server actions; the client shrinks them first.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default nextConfig;
