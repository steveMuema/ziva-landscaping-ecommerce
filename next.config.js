module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinaryLoader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      }
    ],
  },
  // Only non-secret values belong here: `env` inlines them into any bundle that references them,
  // including browser bundles. Server code reads secrets from process.env at runtime.
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};