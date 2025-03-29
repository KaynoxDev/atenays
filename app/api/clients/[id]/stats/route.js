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
    
    // Récupérer les données du client
    const client = await db.collection('clients').findOne({ _id: new ObjectId(id) });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Récupérer les commandes du client
    const orders = await db.collection('orders')
      .find({ clientId: id })
      .toArray();
    
    // Calculer les statistiques
    const stats = {
      totalOrders: orders.length,
      ordersByStatus: {
        completed: orders.filter(order => order.status === 'completed').length,
        inProgress: orders.filter(order => order.status === 'in-progress').length,
        pending: orders.filter(order => order.status === 'pending').length,
        cancelled: orders.filter(order => order.status === 'cancelled').length,
      },
      totalSpent: orders.reduce((sum, order) => {
        if (order.status === 'completed') {
          return sum + (Number(order.price) || 0);
        }
        return sum;
      }, 0),
      recentOrders: orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
