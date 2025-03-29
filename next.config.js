/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow environment variables to be used
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_REGISTER_KEY: process.env.ADMIN_REGISTER_KEY,
  },
  
  // Conservez ces options pour ignorer les erreurs
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig
