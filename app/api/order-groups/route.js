import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Forcer le mode dynamique pour cette API
export const dynamic = "force-dynamic";

// Créer un nouveau groupe de commandes
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const { name, description, orderIds } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: "Le nom du groupe est requis" },
        { status: 400 }
      );
    }
    
    // Créer le groupe
    const orderGroup = {
      name,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('orderGroups').insertOne(orderGroup);
    const groupId = result.insertedId;
    
    // Si des IDs de commandes ont été fournis, les associer au groupe
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      // Valider les IDs de commandes
      const validOrderIds = orderIds.filter(id => ObjectId.isValid(id));
      
      if (validOrderIds.length > 0) {
        await db.collection('orders').updateMany(
          { _id: { $in: validOrderIds.map(id => new ObjectId(id)) } },
          { $set: { orderGroupId: groupId.toString() } }
        );
      }
    }
    
    // Récupérer le groupe créé avec les données complètes
    const createdGroup = await db.collection('orderGroups').findOne(
      { _id: groupId }
    );
    
    return NextResponse.json(createdGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating order group:', error);
    return NextResponse.json(
      { error: error.message || "Une erreur s'est produite lors de la création du groupe" },
      { status: 500 }
    );
  }
}

// Récupérer tous les groupes de commandes
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const orderGroups = await db.collection('orderGroups')
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();
    
    // Pour chaque groupe, récupérer le nombre de commandes associées
    const groupsWithCounts = await Promise.all(
      orderGroups.map(async (group) => {
        const count = await db.collection('orders').countDocuments({
          orderGroupId: group._id.toString()
        });
        
        return {
          ...group,
          orderCount: count
        };
      })
    );
    
    return NextResponse.json(groupsWithCounts);
  } catch (error) {
    console.error('Error fetching order groups:', error);
    return NextResponse.json(
      { error: error.message || "Une erreur s'est produite lors de la récupération des groupes" },
      { status: 500 }
    );
  }
}
