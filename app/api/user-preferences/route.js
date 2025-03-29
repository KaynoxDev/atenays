import { connectToDatabase } from '@/lib/mongodb';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

import { NextResponse } from 'next/server';

// Récupérer les préférences utilisateur
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Pour l'instant, on n'a qu'un seul utilisateur, donc on récupère le premier document
    const preferences = await db.collection('userPreferences').findOne({}) || {
      theme: 'light',
      fontSize: 'medium',
      highContrast: false
    };
    
    return NextResponse.json(preferences);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mettre à jour les préférences utilisateur
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const preferences = await request.json();
    
    // Valider les préférences
    const validatedPreferences = {
      theme: ['light', 'dark'].includes(preferences.theme) ? preferences.theme : 'light',
      fontSize: ['small', 'medium', 'large'].includes(preferences.fontSize) ? preferences.fontSize : 'medium',
      highContrast: Boolean(preferences.highContrast)
    };
    
    // Mettre à jour ou créer le document des préférences
    await db.collection('userPreferences').updateOne(
      {}, 
      { $set: validatedPreferences },
      { upsert: true }
    );
    
    return NextResponse.json(validatedPreferences);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
