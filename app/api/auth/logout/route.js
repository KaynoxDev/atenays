import { NextResponse } from 'next/server';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";


export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Supprimer le cookie d'authentification
  response.cookies.set({
    name: 'auth_token',
    value: '',
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  return response;
}
