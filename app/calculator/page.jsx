'use client';

import dynamic from 'next/dynamic';

// Import the client component with no SSR to avoid server-side hooks issues
const ClientCalculatorPage = dynamic(
  () => import('@/components/ClientCalculatorPage'),
  { ssr: false } // Disable SSR for this component
);

export default function CalculatorPage() {
  return <ClientCalculatorPage />;
}
