import { connectToDatabase } from '@/lib/mongodb';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Make sure the collection exists before querying it
    const collections = await db.listCollections({ name: 'materialCategories' }).toArray();
    if (collections.length === 0) {
      // Collection doesn't exist yet, return empty array
      return NextResponse.json([]);
    }
    
    const categories = await db.collection('materialCategories').find({}).sort({ name: 1 }).toArray();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error in material-categories GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const category = await request.json();
    
    // Basic validation
    if (!category.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    // Check for existing category
    const existingCategory = await db.collection('materialCategories').findOne({ 
      name: { $regex: new RegExp(`^${category.name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return NextResponse.json({ error: 'Cette catégorie existe déjà' }, { status: 400 });
    }
    
    // Add metadata
    category.createdAt = new Date();
    
    const result = await db.collection('materialCategories').insertOne(category);
    const newCategory = await db.collection('materialCategories').findOne({ _id: result.insertedId });
    
    return NextResponse.json(newCategory);
  } catch (error) {
    console.error('Error in material-categories POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
