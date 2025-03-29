import { connectToDatabase } from '@/lib/mongodb';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Récupérer toutes les commandes
    const orders = await db.collection('orders').find({}).toArray();
    
    // Organiser les commandes par client
    const clientStats = {};
    
    orders.forEach(order => {
      if (!order.clientId) return;
      
      if (!clientStats[order.clientId]) {
        clientStats[order.clientId] = {
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          inProgressOrders: 0,
          cancelledOrders: 0
        };
      }
      
      clientStats[order.clientId].totalOrders++;
      
      switch (order.status) {
        case 'completed':
          clientStats[order.clientId].completedOrders++;
          break;
        case 'pending':
          clientStats[order.clientId].pendingOrders++;
          break;
        case 'in-progress':
          clientStats[order.clientId].inProgressOrders++;
          break;
        case 'cancelled':
          clientStats[order.clientId].cancelledOrders++;
          break;
      }
    });
    
    return NextResponse.json(clientStats);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
