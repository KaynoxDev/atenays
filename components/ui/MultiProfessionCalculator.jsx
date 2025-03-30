'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useGet } from '@/hooks/useApi';
import MaterialDetails from '@/components/ui/MaterialDetails';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MultiProfessionCalculator() {
  // Charger les professions depuis l'API
  const { data: professions = [], loading: loadingProfessions } = useGet('/api/professions');
  
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
      console.log("Erreur: Veuillez sélectionner un métier valide.");
      return;
    }
    
    // Ajouter la profession à la liste
    const newProf = {
      name: profName,
      levelRange: levelRange
    };
    
    setSelectedProfessions(prev => [...prev, newProf]);
    setActiveTab(`profession-${selectedProfessions.length}`);
    
    console.log(`Profession ajoutée: ${profName} (niveau ${levelRange}) a été ajoutée au calculateur.`);
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

  // Add new profession to the list (MODIFY THIS FUNCTION)
  const addProfession = () => {
    setSelectedProfessions((prev) => {
      // Create a new unique ID for this profession instance
      const newProfessionId = Date.now();
      
      return [...prev, { 
        id: newProfessionId, // Add an ID to uniquely identify each profession instance
        profession: '', 
        levelRange: '525' 
      }];
    });
  };

  // Update profession at index
  const updateProfession = (index, field, value) => {
    setSelectedProfessions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Filter available professions - REMOVE ANY FILTERING THAT PREVENTS DUPLICATE SELECTIONS
  const availableProfessions = useMemo(() => {
    if (!Array.isArray(professions)) return [];
    
    // Return all professions without filtering out already selected ones
    return professions;
  }, [professions]);
  
  // Mise à jour de l'interface utilisateur pour rendre le bouton "+" plus clair
  // et améliorer l'affichage des quantités de craft
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Professions</CardTitle>
            <CardDescription>Sélectionnez les professions à calculer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Bouton pour ajouter une profession : rendre l'objectif plus clair */}
            <Button
              onClick={addProfession}
              variant="outline"
              className="w-full flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une profession à calculer
            </Button>
            
            {/* Liste des professions sélectionnées */}
            <div className="space-y-4 mt-4">
              {selectedProfessions.map((profItem, index) => (
                <div key={profItem.id || index} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                  {/* ...existing code... */}
                  
                  {/* Clarifier que ce bouton supprime la profession du calculateur */}
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeProfession(index)}
                    className="md:ml-auto"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Panneau des matériaux */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Matériaux requis</CardTitle>
            <CardDescription>
              Résultats du calcul pour les professions sélectionnées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des matériaux...
              </div>
            ) : selectedMaterials.length > 0 ? (
              <div className="space-y-6">
                {/* Liste des matériaux avec quantités mises en évidence */}
                {Object.entries(materialsByCategory).map(([category, materials]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="font-medium text-lg">{category === 'other' ? 'Autres ressources' : category}</h3>
                    
                    <div className="space-y-2">
                      {materials.map((material) => (
                        <div 
                          key={material.id}
                          className="border rounded-lg p-3 hover:bg-accent/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {material.iconName && (
                                <img
                                  src={`https://wow.zamimg.com/images/wow/icons/small/${material.iconName.toLowerCase()}.jpg`}
                                  alt={material.name}
                                  className="w-8 h-8 rounded"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                  }}
                                />
                              )}
                              <div>
                                <div className="font-medium">
                                  {material.name}
                                  {material.isCraftable && (
                                    <Badge variant="outline" className="ml-2">
                                      Craftable
                                    </Badge>
                                  )}
                                </div>
                                {material.profession && (
                                  <div className="text-xs text-muted-foreground">
                                    {material.profession}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Badge plus visible pour la quantité */}
                            <Badge variant="secondary" className="text-base px-3 py-1">
                              {material.quantity}
                            </Badge>
                          </div>
                          
                          {/* Information de crafting pour les matériaux craftables */}
                          {material.isCraftable && material.craftComponents && (
                            <div className="mt-2 pt-2 border-t">
                              <details className="group">
                                <summary className="flex items-center cursor-pointer text-sm text-muted-foreground">
                                  <ChevronDown className="h-4 w-4 mr-1 group-open:hidden" />
                                  <ChevronUp className="h-4 w-4 mr-1 hidden group-open:block" />
                                  Détails du craft
                                </summary>
                                <div className="mt-2 pl-4 space-y-2 text-sm">
                                  {/* Afficher les informations de craft avec quantités */}
                                  <div className="flex items-center gap-1 bg-muted/20 p-1 rounded">
                                    {material.craftComponents.map((component, idx) => (
                                      <React.Fragment key={idx}>
                                        {idx > 0 && <span>+</span>}
                                        <div className="flex items-center">
                                          <Badge variant="outline" className="mr-1 text-xs">
                                            {component.quantity / (material.craftRatio?.craftsNeeded || 1)}
                                          </Badge>
                                          <span>{component.name}</span>
                                        </div>
                                      </React.Fragment>
                                    ))}
                                    <ArrowRight className="h-3 w-3 mx-1" />
                                    <div className="flex items-center">
                                      <Badge className="mr-1 bg-green-100 text-green-800 text-xs">
                                        {material.craftRatio?.outputQuantity || 1}
                                      </Badge>
                                      <span>{material.name}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs">
                                    <span className="font-medium">Pour {material.quantity} unités:</span> {material.craftRatio?.craftsNeeded || Math.ceil(material.quantity)} crafts nécessaires
                                  </div>
                                  
                                  {/* Liste des ressources totales requises */}
                                  <div className="mt-2 pt-2 border-t">
                                    <span className="font-medium text-xs">Ressources nécessaires:</span>
                                    <div className="mt-1 space-y-1">
                                      {material.craftComponents.map((component, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                          <span>{component.name}</span>
                                          <Badge variant="outline">{component.quantity}</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Liste des matériaux totaux */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Liste complète des matériaux</h3>
                  <div className="space-y-1 p-2 bg-muted/20 rounded-lg">
                    {totalList.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.name}</span>
                        <Badge variant="outline">{item.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Sélectionnez au moins une profession pour voir les matériaux requis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Détails du matériau sélectionné */}
      {selectedMaterial && (
        <Card>
          <CardHeader>
            <CardTitle>Détails du matériau</CardTitle>
          </CardHeader>
          <CardContent>
            <MaterialDetails material={selectedMaterial} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
