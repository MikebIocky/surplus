// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables React's Strict Mode for additional checks during development. Helps identify potential problems.
  reactStrictMode: true,

  // Disable ESLint errors from breaking the build (for Vercel deploys)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuration for the next/image component for optimizing images from external sources.
  images: {
    // Defines patterns for allowed external image URLs.
    remotePatterns: [
      // Configuration for allowing images from Unsplash.
      {
        protocol: 'https', // Protocol used (usually https).
        hostname: 'images.unsplash.com', // The domain name of the image source.
        // 'port' and 'pathname' can be omitted if not needed, allowing any port/path on the hostname.
      },
      // Configuration for allowing images from Unsplash Plus (often has different hostname).
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
       // Configuration allowing images from Twitter profile pictures.
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      // --- Configuration for Cloudinary ---
      {
        protocol: 'https',
        // The primary domain for Cloudinary image delivery.
        hostname: 'res.cloudinary.com',
        // Optional: Restrict to your specific cloud name for better security if desired.
        // Replace YOUR_CLOUD_NAME with your actual Cloudinary cloud name.
        // pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name'}/image/upload/**`,
      },
      // Add any other domains you load images from (e.g., specific CDNs, user-provided URLs if validated).
      // Example:
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.example.com',
      // },
    ],
    // Optional: Configure image sizes, formats, etc.
    // deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // formats: ['image/avif', 'image/webp'],
  },

  // Configures server-side redirects. Useful for routing changes or legacy URL support.
  async redirects() {
    return [
      {
        // Redirect requests from the root path ('/')
        source: '/',
        // To the '/listings' path
        destination: '/listings',
        // Use 'permanent: true' (308 status code) if this redirect is final.
        // Use 'permanent: false' (307 status code) for temporary redirects.
        permanent: true,
      },
      // Example: Redirect an old path
      // {
      //   source: '/old-products/:id',
      //   destination: '/product/:id', // Use parameters in destination
      //   permanent: true,
      // },
    ];
  },

  // Other common configurations (add as needed):
  // experimental: {
  //   serverActions: true, // If using Server Actions
  // },
  // env: {
  //   // Public environment variables (accessible client-side) - use NEXT_PUBLIC_ prefix instead usually
  //   // CUSTOM_VAR: process.env.CUSTOM_VAR,
  // },
  // webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  //   // Custom webpack configuration (advanced)
  //   return config;
  // },
};

// Export the configuration object using module.exports for CommonJS compatibility.
module.exports = nextConfig;