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

  // Server Action 암호화 키는 NEXT_SERVER_ACTIONS_ENCRYPTION_KEY 환경변수로 자동 인식됨
  // (Next.js 16부터 config.experimental.serverActions.encryptionKey 속성은 제거됨)
};

export default nextConfig;
