import { connectToDatabase } from '@/lib/mongodb';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

// Cette fonction est nécessaire pour l'export statique des routes dynamiques
export async function generateStaticParams() {
  // Pour l'export statique, nous retournons un tableau vide
  // car ces routes seront gérées par le serveur API externe
  return [];
}

import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    
    const settings = await db.collection('settings').findOne({ _id: new ObjectId(id) });
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    
    const updatedData = await request.json();
    
    // Ajouter la date de mise à jour
    updatedData.updatedAt = new Date();
    
    const result = await db.collection('settings').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }
    
    const updatedSettings = await db.collection('settings').findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
