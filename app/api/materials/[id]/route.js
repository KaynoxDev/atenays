import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Change from force-static to force-dynamic to enable PUT requests
export const dynamic = "force-dynamic";

// Remove the generateStaticParams function to allow dynamic requests

export async function GET(request, { params }) {
  try {
    const id = await params.id;
    
    // Validate that id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid material ID format' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    const material = await db.collection('materials').findOne({ _id: new ObjectId(id) });
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    return NextResponse.json(material);
  } catch (error) {
    console.error('Error getting material:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = await params.id;
    
    // Validate that id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid material ID format' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    const updatedData = await request.json();
    
    // Remove _id field if present to avoid MongoDB errors
    if (updatedData._id) {
      delete updatedData._id;
    }
    
    // Add update timestamp
    updatedData.updatedAt = new Date();
    
    const result = await db.collection('materials').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    const updatedMaterial = await db.collection('materials').findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json(updatedMaterial);
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = await params.id;
    
    // Validate that id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid material ID format' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    const result = await db.collection('materials').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
