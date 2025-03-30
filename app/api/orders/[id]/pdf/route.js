import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";

import { renderToBuffer } from '@react-pdf/renderer';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import React from 'react';

// Force registration of fonts for React PDF
import { Font } from '@react-pdf/renderer';

// Register Helvetica font (commonly available in most environments)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vBB.woff' },
    { 
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvBB.woff',
      fontWeight: 'bold',
    }
  ]
});

export async function GET(request, { params }) {
  try {
    const id = await params.id;
    
    if (!id) {
      console.error('ID parameter is missing');
      return NextResponse.json({ error: 'ID parameter is missing' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Validate ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de commande invalide' }, { status: 400 });
    }
    
    // Get order
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    
    // Convert to plain object
    const plainOrder = {
      ...order,
      _id: order._id.toString()
    };
    
    console.log('Preparing to generate PDF for order:', plainOrder._id);
    
    // Generate filename
    const filename = `commande_${plainOrder._id.substring(0, 8)}.pdf`;
    
    try {
      // Dynamically import the PDF component with better error handling
      let OrderPDF;
      try {
        const module = await import('@/components/ui/OrderPDF');
        OrderPDF = module.default;
        if (!OrderPDF) {
          throw new Error('OrderPDF component imported but is undefined');
        }
      } catch (importError) {
        console.error('Error importing OrderPDF component:', importError);
        throw new Error(`Failed to import OrderPDF component: ${importError.message}`);
      }
      
      // Create the React element correctly with explicit props validation
      console.log('Creating React element with order data');
      const element = React.createElement(OrderPDF, { order: plainOrder });
      
      // Render to buffer with timeout and error handling
      console.log('Rendering PDF to buffer...');
      const buffer = await Promise.race([
        renderToBuffer(element),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF generation timed out after 15s')), 15000)
        )
      ]);
      
      console.log('PDF successfully rendered, sending response');
      
      // Return the PDF with proper headers
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          // Add cache control to prevent caching issues
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    } catch (renderError) {
      console.error('Error rendering PDF:', renderError);
      console.error('Error stack:', renderError.stack);
      
      // Return a more detailed error response
      return NextResponse.json({ 
        error: `PDF rendering failed: ${renderError.message}`,
        stack: renderError.stack,
        orderData: {
          id: plainOrder._id,
          client: plainOrder.clientName,
          professionsCount: Array.isArray(plainOrder.professions) ? plainOrder.professions.length : 0
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in PDF generation process:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
