import type { NextConfig } from "next";

function storageHost() {
  try {
    const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || !url.startsWith("https://") || url.includes("YOUR_")) return null;
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const host = storageHost();

const nextConfig: NextConfig = {
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    VITE_APP_ENV: process.env.VITE_APP_ENV ?? "",
  },
  poweredByHeader: false,
  serverExternalPackages: ["pdfkit"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      ...(host
        ? [
            {
              protocol: "https" as const,
              hostname: host,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
