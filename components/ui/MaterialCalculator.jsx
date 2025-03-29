'use client';

import { useState, useEffect } from 'react';
import { useGet } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Package, RefreshCw, Filter, Search } from 'lucide-react';

export default function MaterialCalculator({ profession, levelRange = '525' }) {
  const [levelFilter, setLevelFilter] = useState(levelRange);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [totalList, setTotalList] = useState([]);
  
  // Chargement des matériaux depuis l'API
  const { data: materials = [], loading: loadingMaterials, error, refetch } = 
    useGet(`/api/materials?profession=${encodeURIComponent(profession)}&levelRange=${levelRange}`);
  
  // Charger les données
  const handleRefresh = () => {
    refetch();
  };
  
  // Filtrer les matériaux
  const filteredMaterials = materials.filter(material => {
    // Filtre de recherche
    if (searchTerm && !material.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtres par onglet
    if (activeTab === 'craftable' && (!material.isBar || !material.barCrafting)) {
      return false;
    } else if (activeTab === 'raw' && material.isBar && material.barCrafting) {
      return false;
    }
    
    return true;
  });
  
  // Ajouter un matériau à la sélection
  const handleAddMaterial = (material, quantity) => {
    setSelectedMaterials(prev => {
      const existingIndex = prev.findIndex(m => m.id === material._id);
      
      if (existingIndex >= 0) {
        // Mettre à jour la quantité si le matériau existe déjà
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        // Ajouter un nouveau matériau
        return [...prev, {
          id: material._id,
          name: material.name,
          iconName: material.iconName,
          quantity: quantity,
          isBar: material.isBar,
          barCrafting: material.barCrafting
        }];
      }
    });
  };
  
  // Supprimer un matériau de la sélection
  const handleRemoveMaterial = (materialId) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== materialId));
  };
  
  // Changer la quantité d'un matériau sélectionné
  const handleQuantityChange = (materialId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setSelectedMaterials(prev => 
      prev.map(m => m.id === materialId ? { ...m, quantity: newQuantity } : m)
    );
  };
  
  // Calculer la liste totale des matériaux nécessaires
  useEffect(() => {
    const calculateMaterials = () => {
      const result = new Map();
      
      // Fonction récursive pour ajouter des matériaux et leurs composants
      const addMaterial = (material, quantity) => {
        // Si c'est un matériau craftable et qu'il a des composants
        if (material.isBar && material.barCrafting) {
          const { primaryResource, secondaryResource, hasSecondaryResource } = material.barCrafting;
          
          if (primaryResource) {
            const primaryQuantity = quantity * (primaryResource.quantityPerBar || 1);
            
            // Créer une clé unique basée sur le nom pour les ressources primaires
            const primaryKey = primaryResource.name;
            
            if (result.has(primaryKey)) {
              result.set(primaryKey, {
                ...result.get(primaryKey),
                quantity: result.get(primaryKey).quantity + primaryQuantity
              });
            } else {
              result.set(primaryKey, {
                id: primaryResource.materialId || primaryKey,
                name: primaryResource.name,
                iconName: primaryResource.iconName,
                quantity: primaryQuantity,
                isRaw: true,
                usedIn: [{
                  name: material.name,
                  quantity: primaryQuantity,
                  iconName: material.iconName
                }]
              });
            }
          }
          
          if (hasSecondaryResource && secondaryResource) {
            const secondaryQuantity = quantity * (secondaryResource.quantityPerBar || 1);
            
            // Créer une clé unique basée sur le nom pour les ressources secondaires
            const secondaryKey = secondaryResource.name;
            
            if (result.has(secondaryKey)) {
              result.set(secondaryKey, {
                ...result.get(secondaryKey),
                quantity: result.get(secondaryKey).quantity + secondaryQuantity
              });
              
              // Ajouter l'information d'utilisation si elle n'existe pas déjà
              const existingResult = result.get(secondaryKey);
              if (!existingResult.usedIn.some(u => u.name === material.name)) {
                existingResult.usedIn.push({
                  name: material.name,
                  quantity: secondaryQuantity,
                  iconName: material.iconName
                });
              }
            } else {
              result.set(secondaryKey, {
                id: secondaryResource.materialId || secondaryKey,
                name: secondaryResource.name,
                iconName: secondaryResource.iconName,
                quantity: secondaryQuantity,
                isRaw: true,
                usedIn: [{
                  name: material.name,
                  quantity: secondaryQuantity,
                  iconName: material.iconName
                }]
              });
            }
          }
        } else {
          // Matériau simple (non craftable)
          const key = material.name;
          
          if (result.has(key)) {
            result.set(key, {
              ...result.get(key),
              quantity: result.get(key).quantity + quantity
            });
          } else {
            result.set(key, {
              id: material.id,
              name: material.name,
              iconName: material.iconName,
              quantity: quantity,
              isRaw: !material.isBar
            });
          }
        }
      };
      
      // Ajouter chaque matériau sélectionné et ses composants si nécessaire
      selectedMaterials.forEach(material => {
        addMaterial(material, material.quantity);
      });
      
      return Array.from(result.values());
    };
    
    setTotalList(calculateMaterials());
  }, [selectedMaterials]);
  
  // Obtenir la liste des matières premières uniquement
  const rawMaterials = totalList.filter(m => m.isRaw);
  
  return (
    <div className="space-y-6">
      {/* En-tête avec le nom de la profession */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{profession}</h2>
          <p className="text-muted-foreground">Calculez les matériaux nécessaires pour ce métier</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loadingMaterials}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingMaterials ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
      
      {/* Filtre et recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un matériau..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value)}>
            <SelectTrigger className="w-[150px]">
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
      </div>
      
      {/* Liste des matériaux disponibles */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="craftable">Craftables</TabsTrigger>
          <TabsTrigger value="raw">Matières premières</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-4">
          {loadingMaterials ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des matériaux...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Erreur lors du chargement des matériaux
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun matériau trouvé
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map(material => (
                <div key={material._id} className="flex items-center p-3 border rounded-md">
                  <div className="flex-shrink-0 mr-3">
                    {material.iconName ? (
                      <img
                        src={`https://wow.zamimg.com/images/wow/icons/small/${material.iconName.toLowerCase()}.jpg`}
                        alt={material.name}
                        className="w-8 h-8 rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                        }}
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <span className="font-medium">{material.name}</span>
                      {material.isBar && material.barCrafting && (
                        <Badge className="ml-2" variant="outline">Craftable</Badge>
                      )}
                    </div>
                    {material.isBar && material.barCrafting && material.barCrafting.primaryResource && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {material.barCrafting.primaryResource.name} + 
                        {material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource ? 
                          ` ${material.barCrafting.secondaryResource.name}` : ''}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      className="w-16 h-8" 
                      min="1" 
                      defaultValue="1" 
                      onChange={(e) => e.target.value = Math.max(1, e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const qty = parseInt(e.target.value, 10);
                          if (qty > 0) handleAddMaterial(material, qty);
                          e.target.value = "1";
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling;
                        const qty = parseInt(input.value, 10) || 1;
                        handleAddMaterial(material, qty);
                        input.value = "1";
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="craftable" className="pt-4">
          {/* Contenu identique mais avec les filtres appliqués dans filteredMaterials */}
          {/* ...même structure que l'onglet "all"... */}
        </TabsContent>
        
        <TabsContent value="raw" className="pt-4">
          {/* Contenu identique mais avec les filtres appliqués dans filteredMaterials */}
          {/* ...même structure que l'onglet "all"... */}
        </TabsContent>
      </Tabs>
      
      {/* Matériaux sélectionnés */}
      {selectedMaterials.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-bold mb-4">Matériaux sélectionnés</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matériau</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedMaterials.map(material => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {material.iconName && (
                        <img 
                          src={`https://wow.zamimg.com/images/wow/icons/small/${material.iconName.toLowerCase()}.jpg`}
                          alt={material.name}
                          className="w-6 h-6 mr-2 rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                          }}
                        />
                      )}
                      <span>{material.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {material.isBar ? (
                      <Badge variant="outline">Craftable</Badge>
                    ) : (
                      <Badge>Matière première</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      className="w-20 h-8" 
                      min="1" 
                      value={material.quantity} 
                      onChange={(e) => handleQuantityChange(material.id, parseInt(e.target.value, 10) || 1)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveMaterial(material.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Résumé total des matériaux nécessaires */}
      {rawMaterials.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-bold mb-4">Matières premières nécessaires</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matériau</TableHead>
                <TableHead>Utilisation</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rawMaterials.map(material => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {material.iconName && (
                        <img 
                          src={`https://wow.zamimg.com/images/wow/icons/small/${material.iconName.toLowerCase()}.jpg`}
                          alt={material.name}
                          className="w-6 h-6 mr-2 rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                          }}
                        />
                      )}
                      <span>{material.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {material.usedIn ? (
                      <div className="flex flex-col gap-1">
                        {material.usedIn.map((usage, idx) => (
                          <div key={idx} className="flex items-center text-xs text-muted-foreground">
                            <span>{usage.quantity}x</span>
                            <ArrowRight className="h-3 w-3 mx-1" />
                            {usage.iconName && (
                              <img 
                                src={`https://wow.zamimg.com/images/wow/icons/small/${usage.iconName.toLowerCase()}.jpg`}
                                alt={usage.name}
                                className="w-4 h-4 mr-1 rounded"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                }}
                              />
                            )}
                            <span>{usage.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {material.quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
