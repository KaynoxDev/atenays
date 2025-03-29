import { NextResponse } from 'next/server';
// Cette directive est nécessaire pour l'export statique
export const dynamic = "force-static";

// Cette fonction est nécessaire pour l'export statique des routes dynamiques
export async function generateStaticParams() {
  // Pour l'export statique, nous retournons un tableau vide
  // car ces routes seront gérées par le serveur API externe
  return [];
}

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { OrderPDF } from '@/components/ui/OrderPDF';

export async function GET(request, { params }) {
  try {
    // Await params.id as required by Next.js App Router
    const id = await params.id;
    
    if (!id) {
      console.error('ID parameter is missing');
      return NextResponse.json({ error: 'ID parameter is missing' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Valider l'ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de commande invalide' }, { status: 400 });
    }
    
    // Récupérer la commande
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    
    // Convert MongoDB document to a plain JavaScript object with proper serialization
    const plainOrder = JSON.parse(JSON.stringify({
      ...order,
      _id: order._id.toString()
    }));
    
    console.log('Generating PDF for order:', plainOrder._id);
    
    // Générer un nom de fichier pour le PDF
    const filename = `commande_${plainOrder._id.substring(0, 8)}.pdf`;
    
    try {
      // Use renderToBuffer instead of renderToStream for better compatibility
      const buffer = await renderToBuffer(
        React.createElement(OrderPDF, { order: plainOrder })
      );
      
      // Retourner le PDF comme une réponse avec le bon Content-Type et Content-Disposition
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (renderError) {
      console.error('Error rendering PDF:', renderError);
      return NextResponse.json({ 
        error: `PDF rendering failed: ${renderError.message}`,
        stack: process.env.NODE_ENV === 'development' ? renderError.stack : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
