import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Forcer le mode dynamique pour cette API
export const dynamic = "force-dynamic";

// Récupérer les ressources combinées pour un groupe de commandes
export async function GET(request, { params }) {
  try {
    const groupId = params.id;
    
    if (!ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { error: "ID de groupe invalide" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Vérifier que le groupe existe
    const group = await db.collection('orderGroups').findOne({
      _id: new ObjectId(groupId)
    });
    
    if (!group) {
      return NextResponse.json(
        { error: "Groupe non trouvé" },
        { status: 404 }
      );
    }
    
    // Récupérer toutes les commandes du groupe
    const orders = await db.collection('orders')
      .find({ orderGroupId: groupId })
      .toArray();
    
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: "Aucune commande dans ce groupe" },
        { status: 404 }
      );
    }
    
    // Extraire toutes les professions de toutes les commandes
    const allProfessions = [];
    orders.forEach(order => {
      if (Array.isArray(order.professions)) {
        order.professions.forEach(prof => {
          if (prof && prof.name) {
            // Ajout d'informations sur la commande et le client pour traçabilité
            allProfessions.push({
              ...prof,
              orderId: order._id.toString(),
              orderName: `${order.clientName} - ${order.character || 'Sans personnage'}`,
              clientId: order.clientId,
              clientName: order.clientName
            });
          }
        });
      }
    });
    
    // Combinaison des ressources cochées de toutes les commandes
    const combinedCheckedResources = {};
    orders.forEach(order => {
      if (order.checkedResources && typeof order.checkedResources === 'object') {
        Object.entries(order.checkedResources).forEach(([resourceId, isChecked]) => {
          if (isChecked) {
            combinedCheckedResources[resourceId] = true;
          }
        });
      }
    });
    
    return NextResponse.json({
      groupId,
      groupName: group.name,
      professions: allProfessions,
      checkedResources: combinedCheckedResources,
      orderCount: orders.length
    });
  } catch (error) {
    console.error('Error fetching group resources:', error);
    return NextResponse.json(
      { error: error.message || "Une erreur s'est produite lors de la récupération des ressources du groupe" },
      { status: 500 }
    );
  }
}
