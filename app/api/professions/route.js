import { connectToDatabase } from '@/lib/mongodb';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const professions = await db.collection('professions').find({}).toArray();
    
    return NextResponse.json(professions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const profession = await request.json();
    
    // Convertir les valeurs min/max en nombres
    if (profession.priceRanges) {
      for (const range in profession.priceRanges) {
        if (profession.priceRanges[range].min) {
          profession.priceRanges[range].min = parseInt(profession.priceRanges[range].min);
        }
        if (profession.priceRanges[range].max) {
          profession.priceRanges[range].max = parseInt(profession.priceRanges[range].max);
        }
      }
    }
    
    const result = await db.collection('professions').insertOne(profession);
    const newProfession = await db.collection('professions').findOne({ _id: result.insertedId });
    
    return NextResponse.json(newProfession);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
