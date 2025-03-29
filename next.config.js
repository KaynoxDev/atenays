/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supprimez la propriété 'output: export' pour permettre à Vercel de gérer le rendu
  // Supprimez aussi disableApiRoutes car Vercel supporte nativement les routes API
  
  // Conservez ces options pour ignorer les erreurs
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig
