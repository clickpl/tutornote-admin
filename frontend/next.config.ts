import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  generateBuildId: async () => {
    return (
      process.env.BUILD_ID ||
      process.env.NEXT_PUBLIC_BUILD_ID ||
      `admin-${new Date().toISOString().slice(0, 10)}`
    );
  },

  experimental: {
    serverActions: {
      encryptionKey: process.env.SERVER_ACTION_ENCRYPTION_KEY,
    },
  },
};

export default nextConfig;
