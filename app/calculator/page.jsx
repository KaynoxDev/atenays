import dynamic from 'next/dynamic';

// Import the client component dynamically with no SSR
const ClientCalculatorPage = dynamic(
  () => import('@/components/ClientCalculatorPage'),
  { ssr: false } // This ensures the component only renders on client-side
);

export default function CalculatorPage() {
  return (
    <ClientCalculatorPage />
  );
}
