import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Make the API route dynamic for Vercel
export const dynamic = "force-dynamic";

// GET handler to fetch all orders or filter by client
export async function GET(request) {
  try {
    console.log('GET /api/orders: Starting request');
    const startTime = Date.now();
    
    const { db } = await connectToDatabase();
    console.log('GET /api/orders: Connected to database');
    
    // Get search parameters from URL
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
    
    // Add error handling and timeouts
    try {
      const orders = await db.collection('orders').find(query).sort({ createdAt: -1 }).toArray();
      
      console.log(`GET /api/orders: Retrieved ${orders.length} orders in ${Date.now() - startTime}ms`);
      
      // Make sure each order has required fields to prevent errors
      const safeOrders = orders.map(order => ({
        _id: order._id.toString(), // Ensure _id is properly serialized
        clientName: order.clientName || 'Client inconnu',
        clientRealm: order.clientRealm || '',
        character: order.character || '',
        professions: Array.isArray(order.professions) ? order.professions : [],
        profession: order.profession || '',  // For backward compatibility
        status: order.status || 'pending',
        createdAt: order.createdAt || new Date().toISOString(),
        price: order.price || 0,
        initialPayment: order.initialPayment || 0,
        updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
        notes: order.notes || ''
      }));
      
      return NextResponse.json(safeOrders);
    } catch (dbError) {
      console.error('Error querying database:', dbError);
      return NextResponse.json({ 
        error: 'Error retrieving orders from database',
        details: dbError.message || 'Unknown database error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch orders', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST handler to create a new order
export async function POST(request) {
  try {
    console.log('POST /api/orders: Starting request');
    const { db } = await connectToDatabase();
    console.log('POST /api/orders: Connected to database');
    
    // Parse request body
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
    const orderWithMetadata = {
      ...orderData,
      orderGroupId: orderData.orderGroupId || null,
      createdAt: orderData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Make sure professions is an array
      professions: Array.isArray(orderData.professions) ? orderData.professions : [],
    };
    
    console.log('POST /api/orders: Inserting new order');
    const result = await db.collection('orders').insertOne(orderWithMetadata);
    
    if (!result.acknowledged) {
      throw new Error('Database insert operation failed');
    }
    
    console.log('POST /api/orders: Order created with ID', result.insertedId);
    
    // Fetch the created order to return
    const newOrder = await db.collection('orders').findOne({ _id: result.insertedId });
    
    return NextResponse.json({
      ...newOrder,
      _id: newOrder._id.toString() // Convert ObjectId to string
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json({ 
      error: 'Failed to create order', 
      details: error.message 
    }, { status: 500 });
  }
}
