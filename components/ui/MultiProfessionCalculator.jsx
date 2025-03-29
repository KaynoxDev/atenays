"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Plus, Download, RotateCw } from 'lucide-react';
import { useGet } from '@/hooks/useApi';

export default function MultiProfessionCalculator({ initialProfessions = [] }) {
  const [selectedProfessions, setSelectedProfessions] = useState(
    initialProfessions.length > 0 
      ? initialProfessions
      : [{ name: "Blacksmithing", levelRange: "525" }]
  );
  const [activeTab, setActiveTab] = useState('combined');
  const [materialProvided, setMaterialProvided] = useState({});
  const { data: professionsList = [], loading: loadingProfessions } = useGet('/api/professions');
  const { data: materialCategories = [], loading: loadingCategories } = useGet('/api/material-categories');
  const [isLoading, setIsLoading] = useState(false);
  const [allMaterials, setAllMaterials] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all'); // Nouveau filtre par catégorie
  const [craftQuantities, setCraftQuantities] = useState({});

  // Table de correspondance entre les noms français et anglais des professions
  const professionMapping = {
    // Français -> Anglais
    "Forge": "Blacksmithing",
    "Couture": "Tailoring",
    "Travail du cuir": "Leatherworking",
    "Ingénierie": "Engineering",
    "Alchimie": "Alchemy",
    "Enchantement": "Enchanting",
    "Joaillerie": "Jewelcrafting",
    "Calligraphie": "Inscription",
    // Anglais -> Anglais (pour assurer la compatibilité)
    "Blacksmithing": "Blacksmithing",
    "Tailoring": "Tailoring",
    "Leatherworking": "Leatherworking",
    "Engineering": "Engineering",
    "Alchemy": "Alchemy",
    "Enchanting": "Enchanting",
    "Jewelcrafting": "Jewelcrafting",
    "Inscription": "Inscription"
  };
  
  // Fonction pour normaliser le nom de la profession en anglais
  const normalizeProffessionName = (name) => {
    return professionMapping[name] || name;
  };
  
  // Ensure professionsList is always an array
  const safeProfessionsList = Array.isArray(professionsList) ? professionsList : [];
  
  // Charger tous les matériaux pour les professions sélectionnées
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!selectedProfessions || selectedProfessions.length === 0) return;
      
      setIsLoading(true);
      try {
        const materialsPromises = selectedProfessions.map(async (prof) => {
          // Normaliser le nom de la profession en anglais pour la requête API
          const normalizedName = normalizeProffessionName(prof.name);
          
          console.log(`Fetching materials for profession: ${normalizedName}, level: ${prof.levelRange}`);
          
          const response = await fetch(
            `/api/materials?profession=${encodeURIComponent(normalizedName)}&levelRange=${prof.levelRange}`
          );
          
          if (!response.ok) throw new Error(`Erreur lors du chargement des matériaux pour ${prof.name}`);
          const data = await response.json();
          
          console.log(`Received ${data.length} materials for ${prof.name}`);
          
          // We now rely primarily on the API's filtering but still do a basic check
          const filteredData = Array.isArray(data) ? data : [];
            
          return {
            profession: prof.name, // Garder le nom original pour l'affichage
            normalizedProfession: normalizedName, // Nom normalisé pour les requêtes
            levelRange: prof.levelRange,
            materials: filteredData
          };
        });
        
        const results = await Promise.all(materialsPromises);
        setAllMaterials(results);
      } catch (error) {
        console.error("Erreur lors du chargement des matériaux:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedProfessions.length > 0) {
      fetchMaterials();
    }
  }, [selectedProfessions]);
  
  // Ajouter une profession à la liste
  const addProfession = () => {
    setSelectedProfessions([...selectedProfessions, { name: "Blacksmithing", levelRange: "525" }]);
  };
  
  // Retirer une profession de la liste
  const removeProfession = (index) => {
    if (selectedProfessions.length <= 1) return;
    const newProfessions = [...selectedProfessions];
    newProfessions.splice(index, 1);
    setSelectedProfessions(newProfessions);
  };
  
  // Mettre à jour une profession
  const updateProfession = (index, field, value) => {
    const newProfessions = [...selectedProfessions];
    newProfessions[index][field] = value;
    setSelectedProfessions(newProfessions);
  };
  
  // Gérer le changement de matériaux fournis par le client
  const handleMaterialProvidedChange = (materialName, value) => {
    setMaterialProvided({
      ...materialProvided,
      [materialName]: parseInt(value) || 0
    });
  };
  // Calculer les matériaux combinés nécessaires
  const combinedMaterials = useMemo(() => {
    // Créer un objet pour stocker tous les matériaux nécessaires
    const combined = {};
    
    // Première passe : collecter tous les matériaux directement nécessaires
    allMaterials.forEach(profMaterials => {
      profMaterials.materials.forEach(material => {
        if (!combined[material.name]) {
          combined[material.name] = {
            name: material.name,
            iconName: material.iconName,
            categoryId: material.categoryId,
            quantity: 0,
            sources: [],
            isBar: material.isBar || false,
            barCrafting: material.barCrafting || null,
            // Nouveau champ pour indiquer si ce matériau est une matière première ou un produit intermédiaire
            isPrimaryResource: true
          };
        }
        
        combined[material.name].quantity += material.quantity;
        combined[material.name].sources.push({
          profession: profMaterials.profession,
          levelRange: profMaterials.levelRange,
          quantity: material.quantity
        });
      });
    });
    
    // Deuxième passe : analyser les barres et ajouter les ressources nécessaires
    // On commence par une liste de matériaux à traiter
    const barsToProcess = Object.values(combined).filter(mat => mat.isBar && mat.barCrafting);
    
    // Traiter chaque barre pour ajouter ses ressources à la liste
    barsToProcess.forEach(bar => {
      const barQuantity = bar.quantity;
      
      // Traiter la ressource principale
      if (bar.barCrafting.primaryResource && bar.barCrafting.primaryResource.name) {
        const primaryResource = bar.barCrafting.primaryResource;
        const resourceName = primaryResource.name;
        const quantityNeeded = barQuantity * (primaryResource.quantityPerBar || 1);
        
        // Ajouter ou mettre à jour cette ressource dans la liste
        if (!combined[resourceName]) {
          combined[resourceName] = {
            name: resourceName,
            iconName: primaryResource.iconName,
            quantity: 0,
            sources: [],
            isPrimaryResource: true
          };
        }
        
        combined[resourceName].quantity += quantityNeeded;
        combined[resourceName].sources.push({
          profession: "Ressource pour " + bar.name,
          quantity: quantityNeeded
        });
      }
      
      // Traiter la ressource secondaire si elle existe
      if (bar.barCrafting.hasSecondaryResource && bar.barCrafting.secondaryResource && bar.barCrafting.secondaryResource.name) {
        const secondaryResource = bar.barCrafting.secondaryResource;
        const resourceName = secondaryResource.name;
        const quantityNeeded = barQuantity * (secondaryResource.quantityPerBar || 1);
        
        // Ajouter ou mettre à jour cette ressource dans la liste
        if (!combined[resourceName]) {
          combined[resourceName] = {
            name: resourceName,
            iconName: secondaryResource.iconName,
            quantity: 0,
            sources: [],
            isPrimaryResource: true
          };
        }
        
        combined[resourceName].quantity += quantityNeeded;
        combined[resourceName].sources.push({
          profession: "Ressource pour " + bar.name,
          quantity: quantityNeeded
        });
      }
      
      // Marquer la barre comme étant un produit intermédiaire
      combined[bar.name].isPrimaryResource = false;
    });
    
    // Troisième passe : soustraire les matériaux fournis par le client
    Object.keys(materialProvided).forEach(matName => {
      if (combined[matName] && materialProvided[matName] > 0) {
        combined[matName].provided = materialProvided[matName];
        combined[matName].needed = Math.max(0, combined[matName].quantity - materialProvided[matName]);
      }
    });
    
    // Quatrième passe : calculer combien de barres peuvent être produites
    Object.values(combined).forEach(material => {
      if (material.isBar && material.barCrafting) {
        const neededAmount = material.needed !== undefined ? material.needed : material.quantity;
        
        // Calculer à partir de la ressource principale
        let maxBarsFromPrimary = Infinity;
        const primaryResource = material.barCrafting.primaryResource;
        if (primaryResource && primaryResource.name && combined[primaryResource.name]) {
          const availableResource = combined[primaryResource.name].needed !== undefined 
            ? combined[primaryResource.name].needed 
            : combined[primaryResource.name].quantity;
          
          if (primaryResource.quantityPerBar > 0) {
            maxBarsFromPrimary = Math.floor(availableResource / primaryResource.quantityPerBar);
          }
        }
        
        // Calculer à partir de la ressource secondaire
        let maxBarsFromSecondary = Infinity;
        if (material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource) {
          const secondaryResource = material.barCrafting.secondaryResource;
          if (secondaryResource.name && combined[secondaryResource.name]) {
            const availableResource = combined[secondaryResource.name].needed !== undefined 
              ? combined[secondaryResource.name].needed 
              : combined[secondaryResource.name].quantity;
            
            if (secondaryResource.quantityPerBar > 0) {
              maxBarsFromSecondary = Math.floor(availableResource / secondaryResource.quantityPerBar);
            }
          }
        }
        
        // Le maximum de barres qu'on peut fabriquer est le minimum des deux
        material.craftableAmount = Math.min(maxBarsFromPrimary, maxBarsFromSecondary, neededAmount);
        
        // Ajout des détails sur les ressources consommées pour la fabrication
        material.craftingDetails = {
          primaryResource: {
            name: primaryResource.name,
            iconName: primaryResource.iconName,
            quantityPerBar: primaryResource.quantityPerBar,
            totalNeeded: material.craftableAmount * primaryResource.quantityPerBar
          }
        };
        
        if (material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource) {
          const secondaryResource = material.barCrafting.secondaryResource;
          material.craftingDetails.secondaryResource = {
            name: secondaryResource.name,
            iconName: secondaryResource.iconName,
            quantityPerBar: secondaryResource.quantityPerBar,
            totalNeeded: material.craftableAmount * secondaryResource.quantityPerBar
          };
        }
      }
    });
    
    return Object.values(combined);
  }, [allMaterials, materialProvided]);
  
  // Filtrer les matériaux par catégorie
  const filteredMaterials = useMemo(() => {
    if (categoryFilter === 'all') {
      return combinedMaterials;
    } else if (categoryFilter === 'uncategorized') {
      return combinedMaterials.filter(mat => !mat.categoryId);
    } else {
      return combinedMaterials.filter(mat => mat.categoryId === categoryFilter);
    }
  }, [combinedMaterials, categoryFilter]);
  
  // Ensure materialCategories is always an array
  const safeMaterialCategories = Array.isArray(materialCategories) ? materialCategories : [];
  
  // Organiser les matériaux par catégorie pour l'affichage
  const materialsByCategory = useMemo(() => {
    const byCategory = {};
    
    // Catégorie pour les matériaux sans catégorie
    byCategory['uncategorized'] = {
      name: "Sans catégorie",
      color: "#9CA3AF",
      materials: []
    };
    
    filteredMaterials.forEach(material => {
      const categoryId = material.categoryId || 'uncategorized';
      
      if (!byCategory[categoryId]) {
        const category = safeMaterialCategories.find(c => c && c._id === categoryId) || {
          name: `Autre-${categoryId}`,
          color: "#9CA3AF"
        };
        
        byCategory[categoryId] = {
          ...category,
          materials: []
        };
      }
      
      byCategory[categoryId].materials.push(material);
    });
    
    // Ne retourner que les catégories qui ont des matériaux
    return Object.values(byCategory).filter(cat => cat.materials.length > 0);
  }, [filteredMaterials, safeMaterialCategories]);
  
  // Exporter la liste des matériaux
  const exportMaterialList = () => {
    const formattedData = combinedMaterials.map(mat => ({
      Nom: mat.name,
      'Quantité Totale': mat.quantity,
      'Fourni par Client': mat.provided || 0,
      'Reste à Acheter': mat.needed
    }));
    
    // Exporter en CSV
    const headers = Object.keys(formattedData[0]).join(',');
    const rows = formattedData.map(item => Object.values(item).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'materiaux_necessaires.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Calculateur de Matériaux Multi-Professions
          </CardTitle>
          <CardDescription>
            Calculez les matériaux nécessaires pour plusieurs professions à la fois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedProfessions.map((prof, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center border-b pb-4">
                <div className="md:col-span-2">
                  <Label>Profession {index + 1}</Label>
                  <Select
                    value={prof.name}
                    onValueChange={(value) => updateProfession(index, 'name', value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Sélectionner une profession" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {loadingProfessions && <SelectItem value="loading" disabled>Chargement...</SelectItem>}
                      {!loadingProfessions && (!safeProfessionsList.length) && (
                        <SelectItem value="no-data" disabled>Aucune profession disponible</SelectItem>
                      )}
                      
                      {safeProfessionsList.map(p => p && (
                        <SelectItem key={p.name} value={p.name || `profession-${index}`}>
                          {p.icon && <span className="mr-2">{p.icon}</span>}
                          {p.name || "Profession sans nom"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label>Niveau</Label>
                  <Select
                    value={prof.levelRange}
                    onValueChange={(value) => updateProfession(index, 'levelRange', value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Niveau cible" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="225">1-225 (Classic)</SelectItem>
                      <SelectItem value="300">1-300 (Vanilla)</SelectItem>
                      <SelectItem value="375">1-375 (TBC)</SelectItem>
                      <SelectItem value="450">1-450 (WotLK)</SelectItem>
                      <SelectItem value="525">1-525 (Cataclysm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProfession(index)}
                    disabled={selectedProfessions.length <= 1}
                    className="text-destructive"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addProfession}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une profession
            </Button>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    // Recharger la page avec les mêmes professions pour rafraîchir les données
                    setAllMaterials([]);
                    setTimeout(() => {
                      const currentProfs = [...selectedProfessions];
                      setSelectedProfessions([]);
                      setTimeout(() => {
                        setSelectedProfessions(currentProfs);
                      }, 50);
                    }, 50);
                  }, 100);
                }}
              >
                <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportMaterialList}
                disabled={combinedMaterials.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="combined">Matériaux Combinés</TabsTrigger>
          <TabsTrigger value="resource-tree">Arbre des Ressources</TabsTrigger>
          <TabsTrigger value="details">Détails par Profession</TabsTrigger>
          <TabsTrigger value="provided">Matériaux Fournis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="combined">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Matériaux Nécessaires - Liste Combinée</CardTitle>
                  <CardDescription>
                    Liste combinée de tous les matériaux nécessaires pour les professions sélectionnées
                  </CardDescription>
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrer par catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="uncategorized">Sans catégorie</SelectItem>
                    {safeMaterialCategories.map(category => (
                      <SelectItem key={category._id || `cat-${Math.random()}`} value={category._id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color || '#3b82f6' }}
                          ></div>
                          <span>{category.icon} {category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Aucun matériau trouvé pour les professions sélectionnées
                </div>
              ) : categoryFilter !== 'all' ? (
                // Affichage simple pour une seule catégorie
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matériau</TableHead>
                      <TableHead>Métiers</TableHead>
                      <TableHead className="text-right">Quantité Totale</TableHead>
                      <TableHead className="text-right">Fourni par Client</TableHead>
                      <TableHead className="text-right">Reste à Acheter</TableHead>
                      <TableHead className="text-right">Production</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material) => (
                      <TableRow key={material.name}>
                        <TableCell className="font-medium">
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
                            <div>
                              <div>{material.name}</div>
                              {!material.isPrimaryResource && (
                                <div className="text-xs text-muted-foreground">(Produit intermédiaire)</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {material.sources && material.sources.map((source, idx) => (
                              <Badge key={`${source.profession}-${idx}`} variant="outline" className="text-xs">
                                {source.profession} ({source.quantity})
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{material.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            max={material.quantity}
                            value={materialProvided[material.name] || 0}
                            onChange={(e) => handleMaterialProvidedChange(material.name, e.target.value)}
                            className="w-20 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold">{material.needed}</TableCell>
                        <TableCell className="text-right">
                          {material.isBar && material.craftingDetails ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-muted-foreground">
                                {material.craftingDetails.primaryResource.quantityPerBar}x {material.craftingDetails.primaryResource.name}
                                {material.barCrafting.hasSecondaryResource && (
                                  <>
                                    <br />
                                    + {material.craftingDetails.secondaryResource.quantityPerBar}x {material.craftingDetails.secondaryResource.name}
                                  </>
                                )}
                              </span>
                              <span className="font-semibold">
                                = {material.craftableAmount || 0} {material.name}
                              </span>
                            </div>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                // Affichage groupé par catégorie
                <div className="space-y-8">
                  {materialsByCategory.map((category, index) => (
                    <div key={category._id || `category-${category.name}-${index}`} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color || '#3b82f6' }}
                        ></div>
                        <h3 className="text-lg font-medium">{category.icon} {category.name}</h3>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Matériau</TableHead>
                            <TableHead>Métiers</TableHead>
                            <TableHead className="text-right">Quantité Totale</TableHead>
                            <TableHead className="text-right">Fourni par Client</TableHead>
                            <TableHead className="text-right">Reste à Acheter</TableHead>
                            <TableHead className="text-right">Production</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.materials.map((material) => (
                            <TableRow key={material.name || `material-${Math.random()}`}>
                              <TableCell className="font-medium">
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
                                  {material.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {material.sources && material.sources.map((source, idx) => (
                                    <Badge key={`${source.profession}-${idx}`} variant="outline" className="text-xs">
                                      {source.profession} ({source.quantity})
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{material.quantity}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  max={material.quantity}
                                  value={materialProvided[material.name] || 0}
                                  onChange={(e) => handleMaterialProvidedChange(material.name, e.target.value)}
                                  className="w-20 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right font-bold">{material.needed}</TableCell>
                              <TableCell className="text-right">
                                {material.resourcesPerBar > 0 ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs text-muted-foreground">
                                      {material.resourcesPerBar} pour 1 {material.outputName || "barre"}
                                      {material.hasSecondaryResource && material.secondaryResourceDetails && (
                                        <>
                                          <br />
                                          + {material.secondaryResourceDetails.neededPerBar} {material.secondaryResourceDetails.name}
                                        </>
                                      )}
                                    </span>
                                    <span className="font-semibold">
                                      = {material.barsProducible || 0} {material.outputName || "barres"}
                                    </span>
                                  </div>
                                ) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resource-tree">
          <Card>
            <CardHeader>
              <CardTitle>Arbre des ressources</CardTitle>
              <CardDescription>
                Visualisez les ressources primaires et les produits intermédiaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : combinedMaterials.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Aucun matériau trouvé pour les professions sélectionnées
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Section des ressources primaires */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Ressources primaires à récolter</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matériau</TableHead>
                          <TableHead>Utilisation</TableHead>
                          <TableHead className="text-right">Quantité totale</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {combinedMaterials.filter(mat => mat.isPrimaryResource).map((material) => (
                          <TableRow key={material.name}>
                            <TableCell className="font-medium">
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
                                {material.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {material.sources && material.sources.map((source, idx) => (
                                  <Badge key={`${source.profession}-${idx}`} variant="outline" className="text-xs">
                                    {source.profession} ({source.quantity})
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">{material.needed || material.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Section des produits intermédiaires */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Produits intermédiaires à fabriquer</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead>Ressources nécessaires</TableHead>
                          <TableHead className="text-right">Quantité à fabriquer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {combinedMaterials.filter(mat => !mat.isPrimaryResource).map((material) => (
                          <TableRow key={material.name}>
                            <TableCell className="font-medium">
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
                                {material.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              {material.isBar && material.craftingDetails && (
                                <div className="space-y-1">
                                  <div className="flex items-center">
                                    <img 
                                      src={`https://wow.zamimg.com/images/wow/icons/small/${material.craftingDetails.primaryResource.iconName?.toLowerCase() || 'inv_misc_questionmark'}.jpg`}
                                      alt={material.craftingDetails.primaryResource.name}
                                      className="w-4 h-4 mr-1 rounded"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                      }}
                                    />
                                    {material.craftingDetails.primaryResource.quantityPerBar}x {material.craftingDetails.primaryResource.name}
                                  </div>
                                  
                                  {material.barCrafting.hasSecondaryResource && (
                                    <div className="flex items-center">
                                      <img 
                                        src={`https://wow.zamimg.com/images/wow/icons/small/${material.craftingDetails.secondaryResource.iconName?.toLowerCase() || 'inv_misc_questionmark'}.jpg`}
                                        alt={material.craftingDetails.secondaryResource.name}
                                        className="w-4 h-4 mr-1 rounded"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                        }}
                                      />
                                      {material.craftingDetails.secondaryResource.quantityPerBar}x {material.craftingDetails.secondaryResource.name}
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold">{material.needed || material.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Détails par Profession</CardTitle>
              <CardDescription>
                Liste des matériaux nécessaires pour chaque profession séparément
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : allMaterials.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="space-y-6">
                  {allMaterials.map((profData, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4">
                        {profData.profession} (1-{profData.levelRange})
                        {profData.profession !== profData.normalizedProfession && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (recherché comme: {profData.normalizedProfession})
                          </span>
                        )}
                      </h3>
                      
                      {profData.materials.length === 0 ? (
                        <p className="text-center py-6 text-muted-foreground">
                          Aucun matériau trouvé pour cette profession
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Matériau</TableHead>
                              <TableHead className="text-right">Quantité</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {profData.materials.map((material) => (
                              <TableRow key={material.name}>
                                <TableCell className="font-medium">
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
                                    {material.name}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{material.quantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="provided">
          <Card>
            <CardHeader>
              <CardTitle>Matériaux Fournis par le Client</CardTitle>
              <CardDescription>
                Gérer les matériaux que le client fournit pour la commande
              </CardDescription>
            </CardHeader>
            <CardContent>
              {combinedMaterials.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Aucun matériau disponible
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matériau</TableHead>
                        <TableHead>Quantité Totale</TableHead>
                        <TableHead>Quantité Fournie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combinedMaterials.map((material) => (
                        <TableRow key={material.name}>
                          <TableCell>{material.name}</TableCell>
                          <TableCell>{material.quantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={material.quantity}
                              value={materialProvided[material.name] || 0}
                              onChange={(e) => handleMaterialProvidedChange(material.name, e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      Les matériaux fournis seront déduits des totaux
                    </span>
                    <Button onClick={() => setMaterialProvided({})}>
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
