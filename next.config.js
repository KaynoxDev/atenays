/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supprimer la propriété output: 'export' car elle n'est pas compatible avec les API routes sur Vercel
  // Garder uniquement les configurations nécessaires
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_REGISTER_KEY: process.env.ADMIN_REGISTER_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig
