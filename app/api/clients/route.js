import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Make the API routes dynamic for Vercel
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log('GET /api/clients: Starting request');
    const { db } = await connectToDatabase();
    console.log('GET /api/clients: Connected to database');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { realm: { $regex: search, $options: 'i' } },
        { character: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('GET /api/clients: Executing query', JSON.stringify(query));
    
    // Execute the query with timeout protection
    const clients = await Promise.race([
      db.collection('clients').find(query).sort({ name: 1 }).toArray(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      )
    ]);
    
    console.log(`GET /api/clients: Retrieved ${clients.length} clients`);
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error in GET /api/clients:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch clients', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('POST /api/clients: Starting request');
    const { db } = await connectToDatabase();
    console.log('POST /api/clients: Connected to database');
    
    // Parse the request body
    let clientData;
    try {
      clientData = await request.json();
    } catch (parseError) {
      console.error('POST /api/clients: JSON parse error', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }
    
    // Validate client data
    if (!clientData || !clientData.name) {
      return NextResponse.json({ 
        error: 'Client name is required' 
      }, { status: 400 });
    }
    
    // Add metadata
    clientData.createdAt = new Date().toISOString();
    clientData.updatedAt = new Date().toISOString();
    
    console.log('POST /api/clients: Inserting new client');
    const result = await db.collection('clients').insertOne(clientData);
    
    if (!result.acknowledged) {
      throw new Error('Database insert operation failed');
    }
    
    console.log('POST /api/clients: Client created with ID', result.insertedId);
    
    // Fetch the created client to return
    const newClient = await db.collection('clients').findOne({ _id: result.insertedId });
    
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/clients:', error);
    return NextResponse.json({ 
      error: 'Failed to create client', 
      details: error.message 
    }, { status: 500 });
  }
}
