import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Ajouter cette ligne pour permettre l'export statique
export const dynamic = "force-static";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collections = await db.listCollections().toArray();
    
    // Extraire les noms des collections
    const collectionNames = collections.map(col => col.name);
    
    return NextResponse.json(collectionNames);
  } catch (error) {
    console.error('Erreur lors de la récupération des collections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
