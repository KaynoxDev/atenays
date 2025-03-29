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
    
    // Validate ID format before attempting to use it
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: `Invalid client ID format: ${id}. Expected a 24-character hex string.` 
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    const client = await db.collection('clients').findOne({ _id: new ObjectId(id) });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error in clients GET by ID:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    
    const updatedData = await request.json();
    
    // S'assurer que _id n'est pas présent dans les données de mise à jour
    if (updatedData._id) {
      delete updatedData._id;
    }
    
    const result = await db.collection('clients').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    const updatedClient = await db.collection('clients').findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json(updatedClient);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    
    const result = await db.collection('clients').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
