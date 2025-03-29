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
    const id = await params.id;
    const { db } = await connectToDatabase();
    
    const category = await db.collection('materialCategories').findOne({ _id: new ObjectId(id) });
    
    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = await params.id;
    
    // Validate that id is a valid ObjectId
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    const updatedData = await request.json();
    
    // Remove _id field if present to avoid MongoDB errors
    if (updatedData._id) {
      delete updatedData._id;
    }
    
    // Add update timestamp
    updatedData.updatedAt = new Date();
    
    // Log data for debugging
    console.log(`Updating category ${id} with data:`, updatedData);
    
    const result = await db.collection('materialCategories').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: `Category with ID ${id} not found` }, { status: 404 });
    }
    
    const updatedCategory = await db.collection('materialCategories').findOne({ _id: new ObjectId(id) });
    
    if (!updatedCategory) {
      return NextResponse.json({ error: 'Failed to retrieve the updated category' }, { status: 500 });
    }
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = await params.id;
    const { db } = await connectToDatabase();
    
    // Vérifier si la catégorie est utilisée par des matériaux
    const materialsCount = await db.collection('materials').countDocuments({ categoryId: id });
    
    if (materialsCount > 0) {
      return NextResponse.json({ 
        error: 'Cette catégorie est utilisée par des matériaux. Veuillez d\'abord changer la catégorie de ces matériaux.' 
      }, { status: 400 });
    }
    
    const result = await db.collection('materialCategories').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
