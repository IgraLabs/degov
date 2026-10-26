import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/": ["./public/**/*"],
  },
  images: {
    // Avatars and treasury logos come from arbitrary user/API-supplied hosts.
    // Serving them through /_next/image made the server an open proxy that
    // fetched and decoded attacker-controlled images (SSRF + sharp/libheif RCE),
    // so images are passed through to the browser unmodified instead.
    unoptimized: true,
  },
  reactStrictMode: false,

  serverExternalPackages: ["js-yaml"],

  reactCompiler: true,

  experimental: {
    staleTimes: {
      dynamic: 300, // 5 minutes for dynamic content
      static: 86400, // 24 hours for static content
    },

    optimizePackageImports: [
      "@rainbow-me/rainbowkit",
      "@tanstack/react-query",
      "wagmi",
      "viem",
      "framer-motion",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-tooltip",
    ],
  },

  // Empty turbopack config to silence webpack warning
  turbopack: {},

  // Webpack fallback for production builds (still uses webpack)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },

  // Compression and caching
  compress: true,
};

export default nextConfig;
