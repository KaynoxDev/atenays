import { connectToDatabase } from '@/lib/mongodb';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    // Récupérer le premier document de paramètres
    // Nous n'utilisons qu'un seul document pour tous les paramètres globaux
    const settings = await db.collection('settings').findOne({});
    
    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const settings = await request.json();
    
    // Ajouter la date de création
    settings.createdAt = new Date();
    settings.updatedAt = new Date();
    
    const result = await db.collection('settings').insertOne(settings);
    const newSettings = await db.collection('settings').findOne({ _id: result.insertedId });
    
    return NextResponse.json(newSettings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
