import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    
    // Récupérer les paramètres de recherche
    const { searchParams } = new URL(request.url);
    const profession = searchParams.get('profession');
    const levelRange = searchParams.get('levelRange');
    const searchTerm = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    
    console.log(`Getting materials with filters: profession=${profession}, levelRange=${levelRange}, search=${searchTerm}`);
    
    // Construire la requête de filtre
    let query = {};
    
    // Filtre par profession - CORRIGÉ pour utiliser une correspondance exacte ou inclure dans le tableau professions
    if (profession) {
      query.$or = [
        { profession },
        { professions: { $in: [profession] } }
      ];
    }
    
    // Filtre par niveau
    if (levelRange) {
      query.levelRange = levelRange;
    }
    
    // Filtre par terme de recherche
    if (searchTerm) {
      query.name = { $regex: searchTerm, $options: 'i' };
    }
    
    // Filtre par catégorie
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    console.log("Materials query:", JSON.stringify(query));
    
    const materials = await db.collection('materials').find(query).toArray();
    
    console.log(`Found ${materials.length} materials matching the query`);
    
    return NextResponse.json(materials);
  } catch (error) {
    console.error('Error in GET /api/materials:', error);
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
