import { connectToDatabase } from '@/lib/mongodb';
// Change from force-static to force-dynamic to enable PUT requests
export const dynamic = "force-dynamic";

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

// Add GET method to ensure the endpoint responds to all expected methods
export async function GET(request, { params }) {
  const id = await params.id;
  
  try {
    const { db } = await connectToDatabase();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de commande invalide' }, { status: 400 });
    }
    
    const order = await db.collection('orders').findOne(
      { _id: new ObjectId(id) },
      { projection: { checkedResources: 1 } }
    );
    
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      checkedResources: order.checkedResources || {} 
    });
  } catch (error) {
    console.error('Error getting order resources:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
