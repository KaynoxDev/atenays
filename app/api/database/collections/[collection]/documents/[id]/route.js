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
    // Utiliser await pour les paramètres dynamiques
    const collection = await params.collection;
    const id = await params.id;
    
    const { db } = await connectToDatabase();
    const document = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error(`Erreur lors de la récupération du document:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    // Utiliser await pour les paramètres dynamiques
    const collection = await params.collection;
    const id = await params.id;
    
    const { db } = await connectToDatabase();
    const updates = await request.json();
    
    // Supprimer _id pour éviter les erreurs de mise à jour
    delete updates._id;
    
    const result = await db.collection(collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    const updatedDocument = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du document:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    // Utiliser await pour les paramètres dynamiques
    const collection = await params.collection;
    const id = await params.id;
    
    const { db } = await connectToDatabase();
    
    // Vérifier si le document existe avant de le supprimer
    const document = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    const result = await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression du document:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
