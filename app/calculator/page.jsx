'use client';

import dynamic from 'next/dynamic';

// Use a loading component to avoid the undefined loading error
const ClientCalculatorPage = dynamic(
  () => import('@/components/ClientCalculatorPage'),
  { 
    ssr: false, // Disable SSR for this component
    loading: () => <div className="container mx-auto p-4">Chargement du calculateur...</div>
  }
);

export default function CalculatorPage() {
  // Simple client-side only component with no references to undefined variables
  return <ClientCalculatorPage />;
}
