import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // 개발자 도구 언어 설정
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right',
    },
  },
  // 개발 서버 설정
  devServer: {
    // 개발자 도구 언어를 한국어로 설정
    devIndicators: {
      buildActivity: true,
    },
  },
  // 환경 변수로 언어 설정
  env: {
    NEXT_LOCALE: 'ko',
  },
};

export default nextConfig;
