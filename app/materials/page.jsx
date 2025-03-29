'use client';

import { useState, useEffect } from 'react';
import { useGet } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Package, Search, Filter, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeProfession, setActiveProfession] = useState('all');
  
  const { data: materials = [], loading: loadingMaterials } = useGet('/api/materials');
  const { data: professions = [], loading: loadingProfessions } = useGet('/api/professions');
  const { data: categories = [], loading: loadingCategories } = useGet('/api/material-categories');
  
  // Add safe null checks for arrays
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeProfessions = Array.isArray(professions) ? professions : [];
  const safeMaterials = Array.isArray(materials) ? materials : [];
  
  // Filtered materials with null check
  const filteredMaterials = safeMaterials.filter(material => {
    // Filter by search term
    const matchesSearch = searchTerm.length === 0 || 
      material.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'craftable' && material.isBar === true) ||
      (activeTab === 'raw' && material.isBar !== true);
    
    // Filter by profession
    const matchesProfession = activeProfession === 'all' || 
      material.profession === activeProfession ||
      (Array.isArray(material.professions) && material.professions.includes(activeProfession));
    
    return matchesSearch && matchesTab && matchesProfession;
  });
  
  // Material counters with safe checks
  const craftableMaterials = safeMaterials.filter(m => m.isBar === true).length;
  const rawMaterials = safeMaterials.filter(m => m.isBar !== true).length;
  
  // Get category name by ID with safe check
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Non catégorisé';
    const category = safeCategories.find(c => c._id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Matériaux</h1>
          <p className="text-muted-foreground">Consultez les matériaux disponibles dans le calculateur</p>
        </div>
        <Link href="/admin/materials">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Gérer les matériaux
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un matériau..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={activeProfession}
                onChange={(e) => setActiveProfession(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">Toutes les professions</option>
                {safeProfessions.map(prof => (
                  <option key={prof._id} value={prof.name}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Tous ({safeMaterials.length})
          </TabsTrigger>
          <TabsTrigger value="craftable">
            Produits craftables ({craftableMaterials})
          </TabsTrigger>
          <TabsTrigger value="raw">
            Matières premières ({rawMaterials})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Liste des matériaux</CardTitle>
              <CardDescription>
                {filteredMaterials.length === 0 && searchTerm 
                  ? "Aucun résultat pour votre recherche" 
                  : `${filteredMaterials.length} matériaux trouvés`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMaterials || loadingCategories || loadingProfessions ? (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 mx-auto mb-4 animate-pulse text-muted-foreground" />
                  <p className="text-muted-foreground">Chargement des matériaux...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun matériau trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMaterials.map(material => (
                    <div key={material._id} className="flex items-start p-3 border rounded-md">
                      <div className="flex-shrink-0 mr-3">
                        {material.iconName ? (
                          <img 
                            src={`https://wow.zamimg.com/images/wow/icons/medium/${material.iconName.toLowerCase()}.jpg`}
                            alt={material.name}
                            className="w-10 h-10 rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center flex-wrap gap-1 mb-1">
                          <span className="font-medium">{material.name}</span>
                          {material.isBar && (
                            <Badge className="ml-1" variant="outline">Craftable</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <span className="mr-2">{material.profession || 'Aucune profession'}</span>
                          •
                          <span className="ml-2">{getCategoryName(material.categoryId)}</span>
                        </div>
                        
                        {material.isBar && material.barCrafting && (
                          <div className="mt-2 text-xs">
                            <span className="font-semibold">Recette:</span> {material.barCrafting.primaryResource?.name || 'Inconnue'}
                            {material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource && 
                              ` + ${material.barCrafting.secondaryResource.name}`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
