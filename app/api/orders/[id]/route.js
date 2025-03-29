import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Export dynamic flag for deployment, as it needs server API features
export const dynamic = "force-dynamic"; // Changed from static to dynamic for API routes

// GET handler for fetching a single order
export async function GET(request, { params }) {
  try {
    const id = await params.id;
    
    // Better validation of ObjectId
    if (!id || !ObjectId.isValid(id)) {
      console.error(`Invalid ObjectId format: ${id}`);
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    console.log(`Fetching order with ID: ${id}`);
    
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    
    if (!order) {
      console.log(`Order not found: ${id}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    console.log(`Successfully retrieved order: ${id}`);
    return NextResponse.json(order);
  } catch (error) {
    console.error(`Error fetching order: ${error.message}`);
    console.error(error.stack);
    return NextResponse.json({ 
      error: 'An error occurred while fetching the order',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT handler for updating an order
export async function PUT(request, { params }) {
  try {
    const id = await params.id;
    
    // Better validation of ObjectId
    if (!id || !ObjectId.isValid(id)) {
      console.error(`Invalid ObjectId format: ${id}`);
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    const updateData = await request.json();
    
    console.log(`Updating order ${id} with:`, updateData);
    
    // Remove _id from update data if present
    if (updateData._id) {
      delete updateData._id;
    }
    
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      console.log(`Order not found for update: ${id}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const updatedOrder = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    console.log(`Successfully updated order: ${id}`);
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(`Error updating order: ${error.message}`);
    console.error(error.stack);
    return NextResponse.json({ 
      error: 'An error occurred while updating the order',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE handler for removing an order
export async function DELETE(request, { params }) {
  try {
    const id = await params.id;
    
    // Validate that the ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      console.error(`Invalid ObjectId format: ${id}`);
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    console.log(`Deleting order: ${id}`);
    
    // First check if the order exists
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    
    if (!order) {
      console.log(`Order not found for deletion: ${id}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Delete the order
    const result = await db.collection('orders').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      console.log(`Failed to delete order: ${id}`);
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
    
    console.log(`Successfully deleted order: ${id}`);
    return NextResponse.json({ 
      success: true,
      message: `Order ${id} successfully deleted`
    });
  } catch (error) {
    console.error(`Error deleting order: ${error.message}`);
    console.error(error.stack);
    return NextResponse.json({ 
      error: 'An error occurred while deleting the order',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    }, { status: 500 });
  }
}
