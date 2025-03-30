'use client';

import { useState } from 'react';
import MultiProfessionCalculator from '@/components/ui/MultiProfessionCalculator';

export default function ClientCalculatorPage() {
  // Define loading state to fix the undefined variable error
  const [loading, setLoading] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Calculateur de ressources</h1>
          <p className="text-muted-foreground">
            Calculez les ressources nécessaires pour monter plusieurs professions
          </p>
        </div>
        {/* Optional loading indicator */}
        {loading && <div className="text-sm text-muted-foreground">Chargement...</div>}
      </div>
      
      <MultiProfessionCalculator onLoadingChange={setLoading} />
    </div>
  );
}
