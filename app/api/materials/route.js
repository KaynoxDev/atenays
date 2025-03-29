import { connectToDatabase } from '@/lib/mongodb';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

import { NextResponse } from 'next/server';

// Add profession name mapping to handle translation between French and English names
const professionMapping = {
  // Français -> Anglais
  "Forge": "Blacksmithing",
  "Couture": "Tailoring",
  "Travail du cuir": "Leatherworking",
  "Ingénierie": "Engineering",
  "Alchimie": "Alchemy",
  "Enchantement": "Enchanting",
  "Joaillerie": "Jewelcrafting", 
  "Calligraphie": "Inscription",
  // Anglais -> Français (for reverse lookup)
  "Blacksmithing": "Forge",
  "Tailoring": "Couture",
  "Leatherworking": "Travail du cuir",
  "Engineering": "Ingénierie",
  "Alchemy": "Alchimie",
  "Enchanting": "Enchantement",
  "Jewelcrafting": "Joaillerie",
  "Inscription": "Calligraphie"
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const profession = searchParams.get('profession');
    const levelRange = searchParams.get('levelRange');
    const categoryId = searchParams.get('categoryId');

    const { db } = await connectToDatabase();
    
    // Build the query based on parameters
    let query = {};
    
    // Log for debugging
    console.log(`API: Searching materials for profession: ${profession}, levelRange: ${levelRange}, categoryId: ${categoryId}`);
    
    // Handle profession filtering with language mapping
    if (profession) {
      // Get possible profession name variants (French and English)
      const professionVariants = [profession];
      
      // Add the translated version if it exists
      if (professionMapping[profession]) {
        professionVariants.push(professionMapping[profession]);
      }
      
      console.log(`API: Looking for profession variants: ${JSON.stringify(professionVariants)}`);
      
      // Search for any of the profession variants
      query.$or = [
        { profession: { $in: professionVariants } },
        { professions: { $in: professionVariants } },
        { 'usedBy.profession': { $in: professionVariants } }
      ];
    }
    
    // Handle level range filtering if specified
    if (levelRange) {
      query.levelRange = levelRange;
    }
    
    // Handle category filtering if specified
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    console.log('API: Final search query:', JSON.stringify(query, null, 2));
    
    // Fetch materials from the database
    const materials = await db.collection('materials').find(query).toArray();
    
    console.log(`API: Found ${materials.length} materials for profession ${profession}`);
    if (materials.length > 0) {
      console.log(`API: First material example: ${materials[0].name}, profession: ${materials[0].profession}`);
    }
    
    return NextResponse.json(materials);
  } catch (error) {
    console.error('Error in GET materials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Seed data function - can be called in POST route initialization if needed
async function seedAlchemyMaterials(db) {
  try {
    // Check if we already have some Alchemy materials
    const existingCount = await db.collection('materials').countDocuments({ 
      profession: { $regex: new RegExp('Alchemy', 'i') }
    });
    
    if (existingCount === 0) {
      console.log('Seeding Alchemy materials...')
    }
  } catch (error) {
    console.error('Error seeding Alchemy materials:', error);
  }
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const material = await request.json();
    
    // Basic validation
    if (!material.name) {
      return NextResponse.json({ error: 'Material name is required' }, { status: 400 });
    }
    
    // Ensure the material has proper profession data
    if (material.usedBy && material.usedBy.length > 0) {
      if (!material.profession) {
        material.profession = material.usedBy[0].profession;
      }
      
      if (!material.professions) {
        material.professions = material.usedBy.map(u => u.profession);
      }
    }
    
    // Add creation timestamp
    material.createdAt = new Date();
    
    // Process the materials collection
    const result = await db.collection('materials').insertOne(material);
    const newMaterial = await db.collection('materials').findOne({ _id: result.insertedId });
    
    // Consider seeding some Alchemy materials if none exist
    const alchemyCount = await db.collection('materials').countDocuments({ 
      profession: { $regex: new RegExp('Alchemy', 'i') }
    });
    
    if (alchemyCount === 0) {
      await seedAlchemyMaterials(db);
    }
    
    return NextResponse.json(newMaterial);
  } catch (error) {
    console.error('Error in POST materials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
