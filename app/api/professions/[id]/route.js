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
    
    const profession = await db.collection('professions').findOne({ _id: new ObjectId(id) });
    
    if (!profession) {
      return NextResponse.json({ error: 'Profession not found' }, { status: 404 });
    }
    
    return NextResponse.json(profession);
  } catch (error) {
    console.error('Error in GET profession:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Validate ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid profession ID format' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    const updatedData = await request.json();
    
    // Remove _id field if present to avoid MongoDB errors
    if (updatedData._id) {
      delete updatedData._id;
    }
    
    // Add update timestamp
    updatedData.updatedAt = new Date();
    
    // Convertir les valeurs min/max en nombres
    if (updatedData.priceRanges) {
      for (const range in updatedData.priceRanges) {
        if (updatedData.priceRanges[range].min) {
          updatedData.priceRanges[range].min = parseInt(updatedData.priceRanges[range].min) || 0;
        }
        if (updatedData.priceRanges[range].max) {
          updatedData.priceRanges[range].max = parseInt(updatedData.priceRanges[range].max) || 0;
        }
      }
    }
    
    console.log(`Updating profession ${id} with data:`, JSON.stringify(updatedData));
    
    const result = await db.collection('professions').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Profession not found' }, { status: 404 });
    }
    
    const updatedProfession = await db.collection('professions').findOne({ _id: new ObjectId(id) });
    
    if (!updatedProfession) {
      return NextResponse.json({ error: 'Updated profession not found' }, { status: 500 });
    }
    
    return NextResponse.json(updatedProfession);
  } catch (error) {
    console.error('Error in PUT profession:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    
    const result = await db.collection('professions').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Profession not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE profession:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
