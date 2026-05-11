/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: true,
      },
      {
        source: "/purse",
        destination: "/nestpurse",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
