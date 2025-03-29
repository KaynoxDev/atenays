import { connectToDatabase } from '@/lib/mongodb';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const clients = await db.collection('clients').find({}).toArray();
    
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const client = await request.json();
    
    client.joinedDate = new Date();
    
    const result = await db.collection('clients').insertOne(client);
    const newClient = await db.collection('clients').findOne({ _id: result.insertedId });
    
    return NextResponse.json(newClient);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
