import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Make the API routes dynamic for Vercel
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log('GET /api/orders: Starting request');
    const { db } = await connectToDatabase();
    console.log('GET /api/orders: Connected to database');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    
    // Build query
    const query = {};
    if (clientId) {
      query.clientId = clientId;
    }
    if (status) {
      query.status = status;
    }
    
    console.log('GET /api/orders: Executing query', JSON.stringify(query));
    
    // Execute the query with timeout protection
    const orders = await Promise.race([
      db.collection('orders').find(query).sort({ createdAt: -1 }).toArray(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      )
    ]);
    
    console.log(`GET /api/orders: Retrieved ${orders.length} orders`);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch orders', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('POST /api/orders: Starting request');
    const { db } = await connectToDatabase();
    console.log('POST /api/orders: Connected to database');
    
    // Parse the request body
    let orderData;
    try {
      orderData = await request.json();
    } catch (parseError) {
      console.error('POST /api/orders: JSON parse error', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }
    
    // Validate the order data
    if (!orderData || typeof orderData !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid order data' 
      }, { status: 400 });
    }
    
    // Add metadata
    orderData.createdAt = new Date().toISOString();
    orderData.updatedAt = new Date().toISOString();
    
    console.log('POST /api/orders: Inserting new order');
    const result = await db.collection('orders').insertOne(orderData);
    
    if (!result.acknowledged) {
      throw new Error('Database insert operation failed');
    }
    
    console.log('POST /api/orders: Order created with ID', result.insertedId);
    
    // Fetch the created order to return
    const newOrder = await db.collection('orders').findOne({ _id: result.insertedId });
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json({ 
      error: 'Failed to create order', 
      details: error.message 
    }, { status: 500 });
  }
}
