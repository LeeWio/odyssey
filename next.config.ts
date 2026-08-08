import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    domains: [
      "images.unsplash.com",
      "heroui-assets.nyc3.cdn.digitaloceanspaces.com",
      "img.heroui.chat",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "heroui-assets.nyc3.cdn.digitaloceanspaces.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.heroui.chat",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    const apiHost = process.env.API_URL || (isDev ? "http://127.0.0.1:8080" : "http://api:8080");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiHost}/api/v1/:path*`,
      },
      {
        source: "/oauth2/:path*",
        destination: `${apiHost}/oauth2/:path*`,
      },
      {
        source: "/login/oauth2/:path*",
        destination: `${apiHost}/login/oauth2/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
