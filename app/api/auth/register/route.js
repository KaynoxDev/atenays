import { NextResponse } from 'next/server';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

import { connectToDatabase } from '@/lib/mongodb';
import * as bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const { username, password, adminKey } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Le nom d\'utilisateur et le mot de passe sont requis' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Vérifier si l'application a déjà des utilisateurs
    const userCount = await db.collection('users').countDocuments({});
    
    // Si c'est le premier utilisateur, il sera l'admin
    // Sinon, vérifier la clé admin (une clé secrète que vous définissez)
    const isAdmin = userCount === 0 || adminKey === process.env.ADMIN_REGISTER_KEY;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.collection('users').findOne({ 
      username: username.toLowerCase() 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ce nom d\'utilisateur est déjà utilisé' },
        { status: 400 }
      );
    }
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer l'utilisateur
    await db.collection('users').insertOne({
      username: username.toLowerCase(),
      password: hashedPassword,
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date()
    });
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Utilisateur créé avec succès',
        isAdmin
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}
