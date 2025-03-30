'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MultiProfessionCalculator from '@/components/ui/MultiProfessionCalculator';

export default function ClientCalculatorPage() {
  const { toast } = useToast();
  
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
