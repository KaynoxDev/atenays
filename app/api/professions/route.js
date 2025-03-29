import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Force dynamic API routes for proper handling
export const dynamic = "force-dynamic";

// Fonction pour obtenir toutes les professions
export async function GET(request) {
  try {
    console.log('GET /api/professions: Starting request');
    const { db } = await connectToDatabase();
    console.log('GET /api/professions: Connected to database');
    
    // Get search parameters for filtering
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    // Build query based on parameters
    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    
    console.log('Query:', query);
    
    // Retrieve professions with proper sorting
    const professions = await db
      .collection('professions')
      .find(query)
      .sort({ name: 1 })
      .toArray();
    
    console.log(`Found ${professions.length} professions`);
    
    return NextResponse.json(professions);
  } catch (error) {
    console.error('Error in GET /api/professions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch professions', 
      details: error.message 
    }, { status: 500 });
  }
}

// Fonction pour créer une nouvelle profession
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    
    // Parse request body
    const professionData = await request.json();
    
    // Validate required fields
    if (!professionData.name) {
      return NextResponse.json({ 
        error: 'Profession name is required' 
      }, { status: 400 });
    }
    
    // Check if profession already exists
    const existingProfession = await db.collection('professions').findOne({ 
      name: professionData.name 
    });
    
    if (existingProfession) {
      return NextResponse.json({ 
        error: 'A profession with this name already exists' 
      }, { status: 400 });
    }
    
    // Set default price ranges if not provided
    if (!professionData.priceRanges) {
      professionData.priceRanges = {
        '225': { min: 200, max: 500 },
        '300': { min: 400, max: 800 },
        '375': { min: 600, max: 1200 },
        '450': { min: 800, max: 1600 },
        '525': { min: 1000, max: 2000 }
      };
    }
    
    // Add metadata
    professionData.createdAt = new Date().toISOString();
    
    // Insert the new profession
    const result = await db.collection('professions').insertOne(professionData);
    
    // Get the newly created profession
    const newProfession = await db.collection('professions').findOne({ 
      _id: result.insertedId 
    });
    
    return NextResponse.json(newProfession);
  } catch (error) {
    console.error('Error in POST /api/professions:', error);
    return NextResponse.json({ 
      error: 'Failed to create profession', 
      details: error.message 
    }, { status: 500 });
  }
}
