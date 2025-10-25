// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }], // or list specific hosts
  },
};
export default nextConfig;