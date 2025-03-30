'use client'; // Add client directive to this page

import { useState } from 'react';
import MultiProfessionCalculator from '@/components/ui/MultiProfessionCalculator';

export default function CalculatorPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Calculateur de ressources</h1>
          <p className="text-muted-foreground">
            Calculez les ressources nécessaires pour monter plusieurs professions
          </p>
        </div>
      </div>
      
      <MultiProfessionCalculator />
    </div>
  );
}
