import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 환경 변수로 언어 설정
  env: {
    NEXT_LOCALE: "ko",
  },
};

export default nextConfig;
