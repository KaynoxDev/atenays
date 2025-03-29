import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Ajouter cette ligne pour permettre l'export statique
export const dynamic = "force-static";

// Cette fonction est nécessaire pour l'export statique des routes dynamiques
export async function generateStaticParams() {
  // Pour l'export statique, nous retournons un tableau vide
  // car ces routes seront gérées par le serveur API externe
  return [];
}

export async function GET(request, { params }) {
  try {
    // Utiliser await pour les paramètres dynamiques
    const collection = await params.collection;
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination et tri
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortField = searchParams.get('sortField') || '_id';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const search = searchParams.get('search') || '';
    
    const { db } = await connectToDatabase();
    
    // Construire un filtre de recherche si nécessaire
    let filter = {};
    if (search) {
      // Recherche dans les champs communs
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { profession: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } },
          // Ajouter d'autres champs au besoin
        ]
      };
    }
    
    // Compter le nombre total de documents
    const total = await db.collection(collection).countDocuments(filter);
    
    // Récupérer les documents avec pagination et tri
    const documents = await db.collection(collection)
      .find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    
    return NextResponse.json({
      documents,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des documents:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
