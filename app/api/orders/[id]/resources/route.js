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

// Mettre à jour les ressources cochées pour une commande
export async function PUT(request, { params }) {
  try {
    const id = await params.id;
    const { db } = await connectToDatabase();
    
    // Valider l'ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de commande invalide' }, { status: 400 });
    }
    
    const requestData = await request.json();
    const { checkedResources } = requestData;
    
    // Valider les données
    if (!checkedResources || typeof checkedResources !== 'object') {
      return NextResponse.json({ 
        error: 'Format des ressources cochées invalide' 
      }, { status: 400 });
    }
    
    // Mettre à jour la commande avec les ressources cochées
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: { checkedResources } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order resources:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
