import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Désactiver les logs en production
const ENABLE_DEBUG_LOGS = process.env.NODE_ENV !== 'production';

export async function middleware(request) {
  // Utiliser une fonction de log conditionnelle
  const log = (...args) => {
    if (ENABLE_DEBUG_LOGS) {
      console.log(...args);
    }
  };
  
  // Check if pathname exists before using it
  const pathname = request.nextUrl?.pathname;
  
  if (!pathname) {
    log('No pathname found in request, allowing access');
    return NextResponse.next();
  }
  
  log('Middleware executing for path:', pathname);
  
  // Liste des pages publiques (accessibles sans connexion)
  const publicPages = ['/login', '/register'];
  
  // API publiques
  const publicApi = ['/api/auth/login', '/api/auth/register'];
  
  // Vérifier si la page est publique
  const isPublicPage = publicPages.some(page => 
    pathname === page || pathname === `${page}/`
  );
  
  // Vérifier si c'est une API publique
  const isPublicApi = publicApi.some(api => 
    pathname.startsWith(api)
  );
  
  // Si c'est une ressource statique ou une page publique, laisser passer
  if (
    pathname.startsWith('/_next') || 
    pathname.includes('/images/') || 
    pathname.includes('.') || 
    isPublicPage || 
    isPublicApi
  ) {
    log('Public resource or page, allowing access');
    return NextResponse.next();
  }
  
  // Récupérer le token d'authentification
  const token = request.cookies.get('auth_token')?.value;
  log('Auth token found:', !!token);
  
  // Si aucun token, rediriger vers la page de connexion
  if (!token) {
    log('No auth token, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    // Ajouter la redirection après la connexion
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Vérifier le token avec jose au lieu de jsonwebtoken
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-key-change-this-in-production'
    );
    
    const { payload } = await jwtVerify(token, secret);
    log('Token verified, user:', payload.username);
    
    // Si l'utilisateur est connecté et essaie d'accéder à la page de connexion, le rediriger vers la page d'accueil
    if (pathname === '/login' || pathname === '/register') {
      log('User already logged in and accessing login page, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Passer l'information de l'utilisateur dans les en-têtes pour l'API
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    
    // Continuer la requête avec les en-têtes modifiés
    log('User authenticated, continuing request');
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Token invalide, rediriger vers la connexion
    log('Invalid token:', error.message);
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Élargir les matchers pour inclure toutes les routes
export const config = {
  matcher: [
    '/((?!api/public|_next/static|_next/image|favicon.ico).*)',
  ],
};
