/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server-side runtime for API routes that need Node.js
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
};

module.exports = nextConfig;
