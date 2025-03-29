'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MultiProfessionCalculator from '@/components/ui/MultiProfessionCalculator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function CalculatorPage() {
  const [activeProfessionSet, setActiveProfessionSet] = useState('custom');
  
  // Exemples de combinaisons prédéfinies (maintenant avec les noms anglais pour compatibilité)
  const predefinedSets = {
    'blacksmith-jeweler': [
      { name: 'Blacksmithing', levelRange: '525' },
      { name: 'Jewelcrafting', levelRange: '525' }
    ],
    'tailor-enchanter': [
      { name: 'Tailoring', levelRange: '525' },
      { name: 'Enchanting', levelRange: '525' }
    ],
    'leatherworking-skinning': [
      { name: 'Leatherworking', levelRange: '525' }
    ],
    'all-professions': [
      { name: 'Blacksmithing', levelRange: '525' },
      { name: 'Tailoring', levelRange: '525' },
      { name: 'Leatherworking', levelRange: '525' },
      { name: 'Engineering', levelRange: '525' },
      { name: 'Alchemy', levelRange: '525' },
      { name: 'Enchanting', levelRange: '525' },
      { name: 'Jewelcrafting', levelRange: '525' },
      { name: 'Inscription', levelRange: '525' }
    ],
    'custom': []
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Calculateur de Matériaux</h1>
        <p className="text-muted-foreground">Calculez les matériaux nécessaires pour monter plusieurs professions</p>
      </div>
      
      <Alert className="bg-blue-50 border border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-800">
          Ce calculateur vous permet de déterminer tous les matériaux nécessaires pour monter une ou plusieurs professions, 
          et de déduire les matériaux déjà en votre possession.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Sélectionnez une combinaison</CardTitle>
          <CardDescription>Choisissez une combinaison prédéfinie ou créez votre propre sélection</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeProfessionSet} 
            onValueChange={setActiveProfessionSet}
            className="mb-6"
          >
            <TabsList className="w-full">
              <TabsTrigger value="custom">Personnalisé</TabsTrigger>
              <TabsTrigger value="blacksmith-jeweler">Forge + Joaillerie</TabsTrigger>
              <TabsTrigger value="tailor-enchanter">Couture + Enchantement</TabsTrigger>
              <TabsTrigger value="leatherworking-skinning">Travail du cuir</TabsTrigger>
              <TabsTrigger value="all-professions">Tous les métiers</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <MultiProfessionCalculator 
            initialProfessions={predefinedSets[activeProfessionSet] || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
