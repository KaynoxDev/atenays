import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
// Ajout pour l'export statique
export const dynamic = "force-static";

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const orders = await db.collection('orders').find({}).toArray();
    
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const order = await request.json();
    
    order.createdAt = new Date();
    
    const result = await db.collection('orders').insertOne(order);
    const newOrder = await db.collection('orders').findOne({ _id: result.insertedId });
    
    return NextResponse.json(newOrder);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
