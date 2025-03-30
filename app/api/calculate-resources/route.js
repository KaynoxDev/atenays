import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Make the API endpoint dynamic to ensure it processes requests at runtime
export const dynamic = "force-dynamic";

// Handle POST requests for resource calculation
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const { professions } = await request.json();
    
    if (!Array.isArray(professions) || professions.length === 0) {
      return NextResponse.json(
        { error: 'Aucune profession sélectionnée' },
        { status: 400 }
      );
    }
    
    console.log('Calculating resources for professions:', professions);
    
    // Array to store all required materials
    const allMaterials = [];
    
    // Process each selected profession
    for (const prof of professions) {
      if (!prof.profession || !prof.levelRange) continue;
      
      // Find materials for this profession and level range
      const profMaterials = await db.collection('materials').find({
        profession: prof.profession,
        levelRange: { $lte: prof.levelRange }
      }).toArray();
      
      // Add these materials to our list
      if (Array.isArray(profMaterials)) {
        allMaterials.push(...profMaterials);
      }
    }
    
    console.log(`Found ${allMaterials.length} materials for selected professions`);
    
    // Process crafting relationships and dependencies
    const processedMaterials = processCraftingRelationships(allMaterials);
    
    return NextResponse.json(processedMaterials);
  } catch (error) {
    console.error('Error calculating resources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate resources' },
      { status: 500 }
    );
  }
}

// Helper function to process crafting relationships and adjust quantities
function processCraftingRelationships(materials) {
  if (!Array.isArray(materials)) return [];
  
  // Create a map for easy access to materials by name
  const materialMap = new Map();
  materials.forEach(mat => {
    // Ensure no duplicates by merging quantities for identical materials
    const existingMat = materialMap.get(mat.name);
    if (existingMat) {
      existingMat.quantity = (existingMat.quantity || 1) + (mat.quantity || 1);
    } else {
      // Clone to avoid modifying the original object
      materialMap.set(mat.name, { ...mat, quantity: mat.quantity || 1 });
    }
  });
  
  // Handle crafting relationships
  materialMap.forEach((material) => {
    if (material.isBar && material.barCrafting) {
      // Handle primary resource
      if (material.barCrafting.primaryResource?.name) {
        const primaryResource = materialMap.get(material.barCrafting.primaryResource.name);
        if (primaryResource) {
          // Calculate how many crafts are needed
          const outputQuantity = material.barCrafting.outputQuantity || 1;
          const craftsNeeded = Math.ceil(material.quantity / outputQuantity);
          const resourceNeeded = craftsNeeded * (material.barCrafting.primaryResource.quantityPerBar || 1);
          
          // Add this resource to our map if not already present
          if (!primaryResource.craftedFor) primaryResource.craftedFor = [];
          primaryResource.craftedFor.push({
            name: material.name,
            quantity: resourceNeeded
          });
          
          // Adjust the quantity needed
          primaryResource.quantity = Math.max(
            primaryResource.quantity || 0,
            resourceNeeded
          );
        }
      }
      
      // Handle secondary resource if present
      if (material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource?.name) {
        const secondaryResource = materialMap.get(material.barCrafting.secondaryResource.name);
        if (secondaryResource) {
          // Calculate how many crafts are needed
          const outputQuantity = material.barCrafting.outputQuantity || 1;
          const craftsNeeded = Math.ceil(material.quantity / outputQuantity);
          const resourceNeeded = craftsNeeded * (material.barCrafting.secondaryResource.quantityPerBar || 1);
          
          // Add this resource to our map if not already present
          if (!secondaryResource.craftedFor) secondaryResource.craftedFor = [];
          secondaryResource.craftedFor.push({
            name: material.name,
            quantity: resourceNeeded
          });
          
          // Adjust the quantity needed
          secondaryResource.quantity = Math.max(
            secondaryResource.quantity || 0,
            resourceNeeded
          );
        }
      }
    }
  });
  
  // Convert map back to array
  return Array.from(materialMap.values());
}
