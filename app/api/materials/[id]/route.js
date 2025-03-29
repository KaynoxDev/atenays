import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

// Cette fonction est nécessaire pour l'export statique des routes dynamiques
export async function generateStaticParams() {
  // Pour l'export statique, nous retournons un tableau vide
  // car ces routes seront gérées par le serveur API externe
  return [];
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    
    const material = await db.collection('materials').findOne({ _id: new ObjectId(id) });
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    return NextResponse.json(material);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = params.id;
    const { db } = await connectToDatabase();
    const material = await request.json();
    
    // Validate required fields
    if (!material.name) {
      return NextResponse.json({ error: 'Material name is required' }, { status: 400 });
    }

    if (!material.profession) {
      return NextResponse.json({ error: 'Profession is required' }, { status: 400 });
    }
    
    // Handle 'none' categoryId
    if (material.categoryId === 'none') {
      material.categoryId = null;
    }
    
    // Ensure quantity is a number
    material.quantity = Number(material.quantity) || 0;
    
    // Add update date
    material.updatedAt = new Date();

    // Remove _id if present to avoid MongoDB error
    if (material._id) {
      delete material._id;
    }
    
    const result = await db.collection('materials').updateOne(
      { _id: new ObjectId(id) },
      { $set: material }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    const updatedMaterial = await db.collection('materials').findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json(updatedMaterial);
  } catch (error) {
    console.error('Error in materials PUT:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    
    const result = await db.collection('materials').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
