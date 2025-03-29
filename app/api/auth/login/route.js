import { NextResponse } from 'next/server';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

import { SignJWT } from 'jose';
import { connectToDatabase } from '@/lib/mongodb';
import * as bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur et mot de passe requis' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Vérifier si l'utilisateur existe
    const user = await db.collection('users').findOne({ username: username.toLowerCase() });
    
    if (!user) {
      // Utiliser un message générique pour éviter de révéler quelles informations sont incorrectes
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }
    
    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }
    
    // Créer un JWT token avec jose au lieu de jsonwebtoken
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-key-change-this-in-production'
    );
    
    const token = await new SignJWT({ 
      userId: user._id.toString(),
      username: user.username,
      role: user.role || 'user'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(secret);
    
    // Renvoyer le token dans un cookie HttpOnly pour plus de sécurité
    const response = NextResponse.json(
      { 
        success: true,
        user: { 
          username: user.username,
          role: user.role || 'user'
        }
      },
      { status: 200 }
    );
    
    // S'assurer que le cookie est correctement défini
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8 // 8 hours
    });
    
    console.log('Login successful, token set in cookie');
    return response;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la connexion' },
      { status: 500 }
    );
  }
}
