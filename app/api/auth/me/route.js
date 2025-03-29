import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

export async function GET() {
  // Pour l'export statique, cette route retournera simplement
  // une réponse vide ou un message statique
  // Le véritable traitement de l'authentification sera géré par le serveur Express
  return NextResponse.json({
    message: "Cette API est remplacée par le serveur d'API externe en production"
  });
  
  // Note: Le code ci-dessous est conservé mais ne sera pas exécuté en production
  // car cette route sera gérée par le serveur Express
  /*
  try {
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({
      userId: user.userId,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  */
}
