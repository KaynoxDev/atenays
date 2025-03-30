'use client';

// Import the client component directly without dynamic loading to avoid loading variable issues
import ClientCalculatorPage from '@/components/ClientCalculatorPage';

export default function CalculatorPage() {
  return <ClientCalculatorPage />;
}
