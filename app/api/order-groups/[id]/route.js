import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Forcer le mode dynamique pour cette API
export const dynamic = "force-dynamic";

// Récupérer un groupe spécifique avec ses commandes
export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de groupe invalide" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Récupérer le groupe
    const group = await db.collection('orderGroups').findOne({
      _id: new ObjectId(id)
    });
    
    if (!group) {
      return NextResponse.json(
        { error: "Groupe non trouvé" },
        { status: 404 }
      );
    }
    
    // Récupérer les commandes du groupe
    const orders = await db.collection('orders')
      .find({ orderGroupId: id })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({
      ...group,
      orders
    });
  } catch (error) {
    console.error('Error fetching order group:', error);
    return NextResponse.json(
      { error: error.message || "Une erreur s'est produite lors de la récupération du groupe" },
      { status: 500 }
    );
  }
}

// Mettre à jour un groupe
export async function PUT(request, { params }) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de groupe invalide" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const { name, description, orderIds } = await request.json();
    
    // Mettre à jour le groupe
    await db.collection('orderGroups').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: name,
          description: description,
          updatedAt: new Date()
        }
      }
    );
    
    // Si orderIds est fourni, mettre à jour les associations
    if (Array.isArray(orderIds)) {
      // D'abord, retirer ce groupe de toutes les commandes associées
      await db.collection('orders').updateMany(
        { orderGroupId: id },
        { $set: { orderGroupId: null } }
      );
      
      // Ensuite, associer les nouvelles commandes
      if (orderIds.length > 0) {
        const validOrderIds = orderIds.filter(orderId => ObjectId.isValid(orderId));
        
        await db.collection('orders').updateMany(
          { _id: { $in: validOrderIds.map(orderId => new ObjectId(orderId)) } },
          { $set: { orderGroupId: id } }
        );
      }
    }
    
    const updatedGroup = await db.collection('orderGroups').findOne({
      _id: new ObjectId(id)
    });
    
    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating order group:', error);
    return NextResponse.json(
      { error: error.message || "Une erreur s'est produite lors de la mise à jour du groupe" },
      { status: 500 }
    );
  }
}

// Supprimer un groupe
export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de groupe invalide" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Dissocier les commandes de ce groupe
    await db.collection('orders').updateMany(
      { orderGroupId: id },
      { $set: { orderGroupId: null } }
    );
    
    // Supprimer le groupe
    const result = await db.collection('orderGroups').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Groupe non trouvé ou déjà supprimé" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order group:', error);
    return NextResponse.json(
      { error: error.message || "Une erreur s'est produite lors de la suppression du groupe" },
      { status: 500 }
    );
  }
}
