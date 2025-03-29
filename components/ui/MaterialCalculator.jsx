'use client';

import { useState, useEffect, useCallback } from 'react';
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
  
  // Assurer que la profession est une chaîne valide
  const safeProfession = typeof profession === 'string' ? profession : '';
  const safeLevelRange = typeof levelRange === 'string' ? levelRange : '525';
  
  // Chargement des matériaux depuis l'API avec sécurité supplémentaire
  const { data: materials = [], loading: loadingMaterials, error, refetch } = 
    useGet(safeProfession ? `/api/materials?profession=${encodeURIComponent(safeProfession)}&levelRange=${safeLevelRange}` : null);
  
  // Assurer que materials est toujours un tableau
  const safeMaterials = Array.isArray(materials) ? materials : [];
  
  // Charger les données avec une fonction stable
  const handleRefresh = useCallback(() => {
    if (safeProfession) {
      refetch();
    }
  }, [safeProfession, refetch]);
  
  // Filtrer les matériaux avec sécurité améliorée
  const filteredMaterials = safeMaterials.filter(material => {
    // Protection supplémentaire contre les objets malformés
    if (!material || typeof material !== 'object') return false;
    
    // Filtre de recherche avec vérification du type de données
    if (searchTerm && typeof material.name === 'string') {
      const materialName = material.name.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      if (!materialName.includes(searchTermLower)) {
        return false;
      }
    } else if (searchTerm) {
      return false; // Si searchTerm est défini mais material.name n'est pas une chaîne
    }
    
    // Filtres par onglet avec vérifications supplémentaires
    if (activeTab === 'craftable') {
      return material.isBar === true && material.barCrafting;
    } else if (activeTab === 'raw') {
      return material.isBar !== true;
    }
    
    return true;
  });
  
  // Ajouter un matériau à la sélection avec vérification améliorée
  const handleAddMaterial = useCallback((material, quantity) => {
    if (!material || typeof material !== 'object') return;
    
    setSelectedMaterials(prev => {
      const existingIndex = prev.findIndex(m => m.id === material._id);
      
      if (existingIndex >= 0) {
        // Mettre à jour la quantité si le matériau existe déjà
        const updated = [...prev];
        updated[existingIndex].quantity = (updated[existingIndex].quantity || 0) + (quantity || 1);
        return updated;
      } else {
        // Ajouter un nouveau matériau avec vérifications des propriétés
        return [...prev, {
          id: material._id || `material-${Date.now()}`,
          name: material.name || 'Matériau sans nom',
          iconName: material.iconName || '',
          quantity: quantity || 1,
          isBar: !!material.isBar,
          barCrafting: material.barCrafting || null
        }];
      }
    });
  }, []);
  
  // Supprimer un matériau avec vérification
  const handleRemoveMaterial = useCallback((materialId) => {
    if (!materialId) return;
    setSelectedMaterials(prev => prev.filter(m => m.id !== materialId));
  }, []);
  
  // Changer la quantité d'un matériau avec vérification
  const handleQuantityChange = useCallback((materialId, newQuantity) => {
    if (!materialId || newQuantity < 1) return;
    
    setSelectedMaterials(prev => 
      prev.map(m => m.id === materialId ? { ...m, quantity: newQuantity } : m)
    );
  }, []);
  
  // Calculer la liste totale des matériaux nécessaires avec sécurité améliorée
  useEffect(() => {
    const calculateMaterials = () => {
      if (!Array.isArray(selectedMaterials) || selectedMaterials.length === 0) {
        return [];
      }
      
      const result = new Map();
      
      // Fonction récursive pour ajouter des matériaux et leurs composants avec vérification
      const addMaterial = (material, quantity) => {
        if (!material || typeof material !== 'object' || !material.name) {
          return;
        }
        
        const materialQty = Number(quantity) || 1;
        
        // Si c'est un matériau craftable et qu'il a des composants
        if (material.isBar && material.barCrafting) {
          const { primaryResource, secondaryResource, hasSecondaryResource } = material.barCrafting;
          
          // Vérifications pour ressource primaire
          if (primaryResource && primaryResource.name) {
            const primaryQuantity = materialQty * (Number(primaryResource.quantityPerBar) || 1);
            const primaryKey = primaryResource.name;
            
            if (result.has(primaryKey)) {
              const existingResource = result.get(primaryKey);
              existingResource.quantity = (existingResource.quantity || 0) + primaryQuantity;
            } else {
              result.set(primaryKey, {
                id: primaryResource.materialId || primaryKey,
                name: primaryResource.name,
                iconName: primaryResource.iconName || '',
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
          
          // Vérifications pour ressource secondaire
          if (hasSecondaryResource && secondaryResource && secondaryResource.name) {
            const secondaryQuantity = materialQty * (Number(secondaryResource.quantityPerBar) || 1);
            const secondaryKey = secondaryResource.name;
            
            if (result.has(secondaryKey)) {
              const existingResource = result.get(secondaryKey);
              existingResource.quantity = (existingResource.quantity || 0) + secondaryQuantity;
              
              // Ajouter l'info d'utilisation si elle n'existe pas
              if (Array.isArray(existingResource.usedIn)) {
                if (!existingResource.usedIn.some(u => u.name === material.name)) {
                  existingResource.usedIn.push({
                    name: material.name,
                    quantity: secondaryQuantity,
                    iconName: material.iconName
                  });
                }
              } else {
                existingResource.usedIn = [{
                  name: material.name,
                  quantity: secondaryQuantity,
                  iconName: material.iconName
                }];
              }
            } else {
              result.set(secondaryKey, {
                id: secondaryResource.materialId || secondaryKey,
                name: secondaryResource.name,
                iconName: secondaryResource.iconName || '',
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
            const existingResource = result.get(key);
            existingResource.quantity = (existingResource.quantity || 0) + materialQty;
          } else {
            result.set(key, {
              id: material.id,
              name: material.name,
              iconName: material.iconName || '',
              quantity: materialQty,
              isRaw: !material.isBar
            });
          }
        }
      };
      
      // Traiter chaque matériau sélectionné
      selectedMaterials.forEach(material => {
        addMaterial(material, material.quantity);
      });
      
      return Array.from(result.values());
    };
    
    setTotalList(calculateMaterials());
  }, [selectedMaterials]);
  
  // Obtenir les matières premières uniquement avec vérification
  const rawMaterials = Array.isArray(totalList) 
    ? totalList.filter(m => m && typeof m === 'object' && m.isRaw === true)
    : [];
  
  return (
    <div className="space-y-6">
      {/* En-tête avec le nom de la profession */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{safeProfession || 'Métier non spécifié'}</h2>
          <p className="text-muted-foreground">Calculez les matériaux nécessaires pour ce métier</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loadingMaterials || !safeProfession}>
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
        
        <TabsContent value={activeTab} className="pt-4">
          {!safeProfession ? (
            <div className="text-center py-8 text-muted-foreground">
              Veuillez sélectionner un métier pour voir les matériaux
            </div>
          ) : loadingMaterials ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des matériaux...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Erreur lors du chargement des matériaux: {error.message || "Erreur inconnue"}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun matériau trouvé pour ce métier
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((material, index) => (
                <div key={material._id || index} className="flex items-center p-3 border rounded-md">
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
              {selectedMaterials.map((material) => (
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
              {rawMaterials.map((material) => (
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
                    {Array.isArray(material.usedIn) && material.usedIn.length > 0 ? (
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
