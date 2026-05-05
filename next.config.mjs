/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placeholder.svg'],
    unoptimized: true
  },
  serverExternalPackages: ['react-image-crop']
}

export default nextConfig
