'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGet } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import MaterialCalculator from '@/components/ui/MaterialCalculator';
import { Trash2, Plus, ChevronsUpDown, Package, Filter, ArrowRight } from 'lucide-react';

export default function MultiProfessionCalculator() {
  // Charger les professions depuis l'API
  const { data: professions = [], loading: loadingProfessions } = useGet('/api/professions');
  const { toast } = useToast();
  
  // Ensure professions is always an array, even if API returns null or undefined
  const safeProfessions = Array.isArray(professions) ? professions : [];
  
  // Sélection des professions
  const [selectedProfessions, setSelectedProfessions] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  
  // Effet pour définir l'onglet actif lors du chargement des professions
  useEffect(() => {
    if (safeProfessions.length > 0 && selectedProfessions.length === 0) {
      // Ne pas auto-sélectionner, laisser l'utilisateur choisir
      setActiveTab(null);
    }
  }, [safeProfessions, selectedProfessions.length]);
  
  // Ajouter une profession
  const handleAddProfession = (profName, levelRange = '525') => {
    // Avoid operations on null/undefined values
    if (!profName) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un métier valide.",
        variant: "destructive"
      });
      return;
    }
    
    // Éviter les doublons - use safeProfessions instead of professions
    if (selectedProfessions.some(p => p.name === profName && p.levelRange === levelRange)) {
      toast({
        title: "Profession déjà ajoutée",
        description: `${profName} (niveau ${levelRange}) est déjà dans votre sélection.`,
        variant: "destructive"
      });
      return;
    }
    
    // Ajouter la profession à la liste
    const newProf = {
      name: profName,
      levelRange: levelRange
    };
    
    setSelectedProfessions(prev => [...prev, newProf]);
    setActiveTab(`profession-${selectedProfessions.length}`);
    
    toast({
      title: "Profession ajoutée",
      description: `${profName} (niveau ${levelRange}) a été ajoutée au calculateur.`
    });
  };
  
  // Supprimer une profession
  const handleRemoveProfession = (index) => {
    setSelectedProfessions(prev => prev.filter((_, i) => i !== index));
    
    // Si l'onglet actif est supprimé, activer un autre onglet
    if (activeTab === `profession-${index}`) {
      if (selectedProfessions.length > 1) {
        const newIndex = index === 0 ? 0 : index - 1;
        setActiveTab(`profession-${newIndex}`);
      } else {
        setActiveTab(null);
      }
    } 
    // Ajuster les indices des onglets
    else if (activeTab && activeTab.startsWith('profession-')) {
      const currentIndex = parseInt(activeTab.split('-')[1]);
      if (currentIndex > index) {
        setActiveTab(`profession-${currentIndex - 1}`);
      }
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calculateur multi-métier</CardTitle>
            <CardDescription>Calculez les matériaux nécessaires pour plusieurs métiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profession">Métier</Label>
                <Select onValueChange={(value) => handleAddProfession(value)}>
                  <SelectTrigger id="profession">
                    <SelectValue placeholder="Sélectionner un métier" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProfessions ? (
                      <SelectItem value="loading" disabled>Chargement des métiers...</SelectItem>
                    ) : safeProfessions.length === 0 ? (
                      <SelectItem value="none" disabled>Aucun métier disponible</SelectItem>
                    ) : (
                      safeProfessions.map(profession => (
                        <SelectItem key={profession._id || `prof-${Math.random()}`} value={profession.name}>
                          {profession.icon} {profession.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label>Métiers actuellement sélectionnés</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedProfessions.map((prof, index) => (
                    <div 
                      key={index} 
                      className={`
                        flex items-center gap-1.5 px-3 py-1 rounded-full text-sm 
                        ${activeTab === `profession-${index}` 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'}
                      `}
                    >
                      <span>{prof.name} ({prof.levelRange})</span>
                      <button 
                        onClick={() => handleRemoveProfession(index)} 
                        className="text-muted-foreground hover:text-white rounded-full"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  {selectedProfessions.length === 0 && (
                    <div className="text-muted-foreground italic">
                      Aucun métier sélectionné
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {selectedProfessions.length > 0 ? (
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader className="flex flex-row items-center">
                <div className="flex-1">
                  <CardTitle>Calculateur de matériaux</CardTitle>
                  <CardDescription>Calculez les matériaux nécessaires pour chaque métier</CardDescription>
                </div>
                <TabsList className="overflow-x-auto">
                  {selectedProfessions.map((prof, index) => (
                    <TabsTrigger key={index} value={`profession-${index}`}>
                      {prof.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </CardHeader>
              <CardContent>
                {selectedProfessions.map((prof, index) => (
                  <TabsContent key={index} value={`profession-${index}`}>
                    <MaterialCalculator 
                      profession={prof.name} 
                      levelRange={prof.levelRange}
                    />
                  </TabsContent>
                ))}
              </CardContent>
            </Tabs>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun métier sélectionné</h3>
              <p className="text-muted-foreground">
                Sélectionnez un métier dans la liste ci-dessus pour commencer à calculer les matériaux nécessaires.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
