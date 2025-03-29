import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Force dynamic API routes for proper handling on Vercel
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    // Extract the client ID from params
    const id = await params.id;
    
    // Validate that the ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      console.error(`Invalid ObjectId format: ${id}`);
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    console.log(`Fetching client with ID: ${id}`);
    
    const client = await db.collection('clients').findOne({ _id: new ObjectId(id) });
    
    if (!client) {
      console.log(`Client not found: ${id}`);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Return the client data with proper serialization
    return NextResponse.json({
      ...client,
      _id: client._id.toString() // Ensure _id is properly serialized
    });
  } catch (error) {
    console.error(`Error fetching client: ${error.message}`);
    console.error(error.stack);
    return NextResponse.json({ 
      error: 'An error occurred while fetching the client',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT handler for updating a client
export async function PUT(request, { params }) {
  try {
    const id = await params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    const updateData = await request.json();
    
    console.log(`Updating client ${id} with:`, updateData);
    
    // Remove _id from update data if present to avoid MongoDB errors
    if (updateData._id) {
      delete updateData._id;
    }
    
    // Add updated timestamp
    updateData.updatedAt = new Date().toISOString();
    
    const result = await db.collection('clients').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    const updatedClient = await db.collection('clients').findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({
      ...updatedClient,
      _id: updatedClient._id.toString()
    });
  } catch (error) {
    console.error(`Error updating client: ${error.message}`);
    return NextResponse.json({ 
      error: 'An error occurred while updating the client',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE handler for removing a client
export async function DELETE(request, { params }) {
  try {
    const id = await params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Check if there are any orders associated with this client
    const ordersCount = await db.collection('orders').countDocuments({ clientId: id });
    
    if (ordersCount > 0) {
      return NextResponse.json({
        error: `Cannot delete client with ${ordersCount} associated orders. Delete the orders first or reassign them.`
      }, { status: 400 });
    }
    
    const result = await db.collection('clients').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Client deleted successfully' 
    });
  } catch (error) {
    console.error(`Error deleting client: ${error.message}`);
    return NextResponse.json({ 
      error: 'An error occurred while deleting the client',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    }, { status: 500 });
  }
}
