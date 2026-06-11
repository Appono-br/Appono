import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/cliente/dashboard",
        permanent: true,
      },
      {
        source: "/reservas",
        destination: "/cliente/reservas",
        permanent: true,
      },
      {
        source: "/mensagens",
        destination: "/cliente/mensagens",
        permanent: true,
      },
      {
        source: "/mensagens/:conversationId",
        destination: "/cliente/mensagens/:conversationId",
        permanent: true,
      },
      {
        source: "/configuracoes",
        destination: "/cliente/configuracoes",
        permanent: true,
      },
      {
        source: "/configuracoes/:path*",
        destination: "/cliente/configuracoes/:path*",
        permanent: true,
      },
      {
        source: "/detalhes-pedido",
        destination: "/cliente/detalhes-pedido",
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
