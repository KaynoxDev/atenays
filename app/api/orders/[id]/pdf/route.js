import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";

import { renderToBuffer } from '@react-pdf/renderer';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import React from 'react';

export async function GET(request, { params }) {
  try {
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
      // Import dynamically with a clear variable name to avoid confusion
      const OrderPDFModule = await import('@/components/ui/OrderPDF');
      const OrderPDFComponent = OrderPDFModule.default || OrderPDFModule.OrderPDF;
      
      if (!OrderPDFComponent) {
        throw new Error('OrderPDF component not found in import');
      }
      
      console.log('OrderPDF component loaded successfully');
      
      // Create the element with React.createElement
      const element = React.createElement(OrderPDFComponent, { order: plainOrder });
      
      // Debug the element
      console.log('React element created:', 
        element && typeof element === 'object' ? 'Valid React element' : 'Invalid element');
      
      // Render to buffer
      const buffer = await renderToBuffer(element);
      
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
      console.error('Error details:', renderError.stack);
      
      // Try to provide more debugging information
      return NextResponse.json({ 
        error: `PDF rendering failed: ${renderError.message}`,
        stack: renderError.stack,
        componentType: typeof (await import('@/components/ui/OrderPDF')).default
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
