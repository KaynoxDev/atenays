'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label'; // Add missing Label import
import { Trash2, Plus, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useGet } from '@/hooks/useApi';
import MaterialDetails from '@/components/ui/MaterialDetails';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MultiProfessionCalculator({ onLoadingChange, initialSelectedMaterials = [] }) {
  const [selectedProfessions, setSelectedProfessions] = useState([
    { profession: '', levelRange: '525' }
  ]);
  const [selectedMaterials, setSelectedMaterials] = useState(initialSelectedMaterials || []);
  const [loading, setLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [totalList, setTotalList] = useState([]);
  
  // Notify parent about loading state changes
  useEffect(() => {
    if (typeof onLoadingChange === 'function') {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);
  
  // Safely group materials by category
  const materialsByCategory = useMemo(() => {
    if (!Array.isArray(selectedMaterials) || selectedMaterials.length === 0) {
      return {};
    }
    
    return selectedMaterials.reduce((acc, material) => {
      if (!material) return acc;
      const category = material.categoryId || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(material);
      return acc;
    }, {});
  }, [selectedMaterials]);
  
  // Add profession
  const addProfession = () => {
    setSelectedProfessions(prev => [
      ...prev,
      { profession: '', levelRange: '525' }
    ]);
  };
  
  // Remove profession
  const removeProfession = (index) => {
    setSelectedProfessions(prev => prev.filter((_, i) => i !== index));
  };
  
  // Update profession
  const updateProfession = (index, field, value) => {
    setSelectedProfessions(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };
  
  // Calculate materials
  const handleCalculate = async () => {
    if (!selectedProfessions.some(p => p.profession)) {
      console.log("Veuillez sélectionner au moins une profession");
      return;
    }
    
    // Filter out empty professions
    const professions = selectedProfessions.filter(p => p.profession);
    
    try {
      setLoading(true);
      if (typeof onLoadingChange === 'function') {
        onLoadingChange(true);
      }
      
      const response = await fetch('/api/calculate-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ professions })
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate resources');
      }
      
      const data = await response.json();
      
      // Make sure we set a safe array to avoid filter errors
      setSelectedMaterials(Array.isArray(data) ? data : []);
      setTotalList(generateTotalList(data));
    } catch (error) {
      console.error("Error calculating materials:", error);
      // Set fallback empty arrays
      setSelectedMaterials([]);
      setTotalList([]);
    } finally {
      setLoading(false);
      if (typeof onLoadingChange === 'function') {
        onLoadingChange(false);
      }
    }
  };

  // Generate consolidated list
  const generateTotalList = (materials) => {
    if (!Array.isArray(materials)) return [];
    
    const totals = {};
    
    materials.forEach(material => {
      if (!material) return;
      
      const key = material.name;
      if (!totals[key]) {
        totals[key] = {
          name: material.name,
          quantity: 0
        };
      }
      totals[key].quantity += material.quantity || 0;
    });
    
    return Object.values(totals).sort((a, b) => a.name.localeCompare(b.name));
  };
  
  // Handle material selection
  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
  };
  
  return (
    <div className="space-y-6">
      {/* Profession selection */}
      <Card>
        <CardHeader>
          <CardTitle>Sélection des Professions</CardTitle>
          <CardDescription>
            Choisissez les professions que vous souhaitez monter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedProfessions.map((prof, index) => (
              <div key={index} className="flex items-end gap-4">
                {/* Profession select */}
                <div className="space-y-2 flex-1">
                  <Label>Profession {index + 1}</Label>
                  <Select 
                    value={prof.profession} 
                    onValueChange={(value) => updateProfession(index, 'profession', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une profession" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alchimie">Alchimie</SelectItem>
                      <SelectItem value="Forge">Forge</SelectItem>
                      <SelectItem value="Couture">Couture</SelectItem>
                      <SelectItem value="Enchantement">Enchantement</SelectItem>
                      <SelectItem value="Ingénierie">Ingénierie</SelectItem>
                      <SelectItem value="Joaillerie">Joaillerie</SelectItem>
                      <SelectItem value="Travail du cuir">Travail du cuir</SelectItem>
                      <SelectItem value="Calligraphie">Calligraphie</SelectItem>
                      <SelectItem value="Minage">Minage</SelectItem>
                      <SelectItem value="Herboristerie">Herboristerie</SelectItem>
                      <SelectItem value="Dépeçage">Dépeçage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Level range select */}
                <div className="space-y-2 w-[180px]">
                  <Label>Niveau</Label>
                  <Select 
                    value={prof.levelRange} 
                    onValueChange={(value) => updateProfession(index, 'levelRange', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="225">1-225 (Classic)</SelectItem>
                      <SelectItem value="300">1-300 (Vanilla)</SelectItem>
                      <SelectItem value="375">1-375 (TBC)</SelectItem>
                      <SelectItem value="450">1-450 (WotLK)</SelectItem>
                      <SelectItem value="525">1-525 (Cataclysm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Remove button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProfession(index)}
                  disabled={selectedProfessions.length === 1}
                  className="mb-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProfession}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une profession
              </Button>
              
              <Button
                type="button"
                onClick={handleCalculate}
                className="mt-2"
              >
                Calculer les ressources
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Materials panel */}
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
          ) : Array.isArray(selectedMaterials) && selectedMaterials.length > 0 ? (
            <div className="space-y-6">
              {/* Materials by category */}
              {materialsByCategory && Object.entries(materialsByCategory).map(([category, materials]) => (
                <div key={category} className="space-y-2">
                  <h3 className="font-medium">{category}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {materials.map((material, idx) => (
                      <div 
                        key={idx}
                        className="p-2 bg-accent/10 rounded-lg flex justify-between items-center cursor-pointer hover:bg-accent/20"
                        onClick={() => handleMaterialClick(material)}
                      >
                        <span>{material.name}</span>
                        <Badge variant="outline">{material.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Total list */}
              {Array.isArray(totalList) && totalList.length > 0 && (
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
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Sélectionnez au moins une profession et calculez pour voir les matériaux requis
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Material details panel */}
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
