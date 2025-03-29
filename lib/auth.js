import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns {Promise<Object|null>} - Les données de l'utilisateur ou null si non authentifié
 */
export async function getAuthUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');
    
    if (!token) return null;
    
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-key-change-this-in-production'
    );
    
    const { payload } = await jwtVerify(token.value, secret);
    
    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role
    };
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return null;
  }
}

/**
 * Middleware pour protéger les routes nécessitant une authentification
 */
export function withAuth(handler) {
  return async function(request) {
    const user = await getAuthUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Ajouter l'utilisateur à la requête
    request.user = user;
    
    return handler(request);
  };
}

/**
 * Middleware pour protéger les routes nécessitant un rôle admin
 */
export function withAdminAuth(handler) {
  return async function(request) {
    const user = await getAuthUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Ajouter l'utilisateur à la requête
    request.user = user;
    
    return handler(request);
  };
}
