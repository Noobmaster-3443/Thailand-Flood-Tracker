/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // react-leaflet double mount in strict mode can cause duplicate map container
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
