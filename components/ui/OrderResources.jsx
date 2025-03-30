'use client';

import React from 'react'; // Proper React import with correct capitalization
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGet } from '@/hooks/useApi';
import { Check, Package, Filter, ArrowRight } from 'lucide-react';

export default function OrderResources({ order, professions, checkedResources = {}, onToggleResource }) {
  const [resourceList, setResourceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Charger les ressources pour les professions de la commande
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        
        // Les professions devraient être déjà formatées correctement à ce niveau
        if (!professions || professions.length === 0) {
          setResourceList([]);
          setLoading(false);
          return;
        }
        
        // Récupérer les matériaux pour chaque profession
        const promises = professions.map(async (prof) => {
          const response = await fetch(
            `/api/materials?profession=${encodeURIComponent(prof.name)}&levelRange=${prof.levelRange}`
          );
          
          if (!response.ok) {
            throw new Error(`Erreur lors du chargement des ressources pour ${prof.name}`);
          }
          
          const materials = await response.json();
          return {
            profession: prof.name,
            levelRange: prof.levelRange,
            materials: Array.isArray(materials) ? materials : []
          };
        });
        
        const results = await Promise.all(promises);
        
        // Maps pour suivre les ressources
        const resourcesMap = new Map(); // Pour les matières premières
        const craftableResourcesMap = new Map(); // Pour les craftables
        const craftRelationships = new Map(); // Pour stocker les relations de craft
        
        // Premier passage : collecter et cumuler toutes les ressources
        results.forEach(profMaterials => {
          profMaterials.materials.forEach(material => {
            const materialName = material.name;
            const resourceId = material._id || `${materialName}-${profMaterials.profession}`;
            
            const resourceWithMeta = {
              ...material,
              id: resourceId,
              profession: profMaterials.profession,
              levelRange: profMaterials.levelRange,
              isCraftable: material.isBar && material.barCrafting,
              originalQuantity: material.quantity || 1
            };
            
            // Stocker les ressources craftables séparément
            if (resourceWithMeta.isCraftable) {
              if (craftableResourcesMap.has(materialName)) {
                // Cumuler les quantités pour les ressources identiques
                const existing = craftableResourcesMap.get(materialName);
                existing.quantity = (existing.quantity || 1) + (material.quantity || 1);
                
                // Ajouter la profession si elle ne l'est pas déjà
                if (!existing.professions.includes(profMaterials.profession)) {
                  existing.professions.push(profMaterials.profession);
                }
              } else {
                // Nouvelle ressource craftable
                resourceWithMeta.professions = [profMaterials.profession];
                resourceWithMeta.craftComponents = []; // Pour stocker les composants
                craftableResourcesMap.set(materialName, resourceWithMeta);
              }
            } else {
              // Ressources non-craftables
              if (resourcesMap.has(materialName)) {
                // Cumuler les quantités pour les ressources identiques
                const existing = resourcesMap.get(materialName);
                existing.quantity = (existing.quantity || 1) + (material.quantity || 1);
                
                // Ajouter la profession si elle ne l'est pas déjà
                if (!existing.professions) existing.professions = [existing.profession];
                if (!existing.professions.includes(profMaterials.profession)) {
                  existing.professions.push(profMaterials.profession);
                }
              } else {
                // Nouvelle ressource
                resourceWithMeta.professions = [profMaterials.profession];
                resourcesMap.set(materialName, resourceWithMeta);
              }
            }
          });
        });
        
        // Deuxième passage pour établir les relations entre craftables et composants
        craftableResourcesMap.forEach((craftable) => {
          if (craftable.barCrafting) {
            // Récupérer la quantité produite par craft (par défaut: 1)
            const outputQuantity = craftable.barCrafting.outputQuantity || 1;
            
            // Traiter la ressource primaire
            if (craftable.barCrafting.primaryResource && craftable.barCrafting.primaryResource.name) {
              const primary = craftable.barCrafting.primaryResource;
              const primaryName = primary.name;
              
              // Calculer le nombre de crafts nécessaires en tenant compte de outputQuantity
              const craftsNeeded = Math.ceil(craftable.quantity / outputQuantity);
              const totalQuantityNeeded = craftsNeeded * (primary.quantityPerBar || 1);
              
              // Ajouter ce composant au craftable
              craftable.craftComponents.push({
                name: primaryName,
                iconName: primary.iconName,
                quantity: totalQuantityNeeded,
                isPrimary: true,
                craftsNeeded: craftsNeeded // Stocker le nombre de crafts pour référence
              });
              
              // Trouver la ressource dans notre liste
              const primaryResource = resourcesMap.get(primaryName);
              
              // Si la ressource n'existe pas, l'ajouter
              if (!primaryResource) {
                const newResourceId = primary.materialId || `${primaryName}-resource`;
                const newResource = {
                  id: newResourceId,
                  name: primaryName,
                  iconName: primary.iconName,
                  quantity: totalQuantityNeeded,
                  isPrimaryResource: true,
                  profession: craftable.profession,
                  professions: craftable.professions,
                  levelRange: craftable.levelRange
                };
                resourcesMap.set(primaryName, newResource);
              }
              
              // Établir la relation de craft
              if (!craftRelationships.has(primaryName)) {
                craftRelationships.set(primaryName, []);
              }
              craftRelationships.get(primaryName).push({
                craftableId: craftable.id,
                craftableName: craftable.name,
                iconName: craftable.iconName,
                quantityNeeded: totalQuantityNeeded
              });
            }
            
            // Traiter la ressource secondaire avec la même logique
            if (craftable.barCrafting.hasSecondaryResource && 
                craftable.barCrafting.secondaryResource && 
                craftable.barCrafting.secondaryResource.name) {
              
              const secondary = craftable.barCrafting.secondaryResource;
              const secondaryName = secondary.name;
              
              // Utiliser le même nombre de crafts que pour la ressource primaire
              const craftsNeeded = Math.ceil(craftable.quantity / outputQuantity);
              const totalQuantityNeeded = craftsNeeded * (secondary.quantityPerBar || 1);
              
              // Ajouter ce composant au craftable
              craftable.craftComponents.push({
                name: secondaryName,
                iconName: secondary.iconName,
                quantity: totalQuantityNeeded,
                isSecondary: true,
                craftsNeeded: craftsNeeded
              });
              
              // Vérifier si cette ressource existe déjà
              const secondaryResource = resourcesMap.get(secondaryName);
              
              if (!secondaryResource) {
                // Ajouter comme nouvelle ressource
                const newResourceId = secondary.materialId || `${secondaryName}-resource`;
                const newResource = {
                  id: newResourceId,
                  name: secondaryName,
                  iconName: secondary.iconName,
                  quantity: totalQuantityNeeded,
                  isSecondaryResource: true,
                  profession: craftable.profession,
                  professions: craftable.professions,
                  levelRange: craftable.levelRange
                };
                resourcesMap.set(secondaryName, newResource);
              }
              
              // Établir la relation de craft
              if (!craftRelationships.has(secondaryName)) {
                craftRelationships.set(secondaryName, []);
              }
              craftRelationships.get(secondaryName).push({
                craftableId: craftable.id,
                craftableName: craftable.name,
                iconName: craftable.iconName,
                quantityNeeded: totalQuantityNeeded,
                isSecondary: true
              });
            }
            
            // Calculer et stocker les informations de ratio dans le craftable
            if (craftable.barCrafting.primaryResource && 
                craftable.barCrafting.hasSecondaryResource && 
                craftable.barCrafting.secondaryResource) {
              
              const primaryResource = craftable.barCrafting.primaryResource;
              const secondaryResource = craftable.barCrafting.secondaryResource;
              
              // Calculer le ratio de craft
              const primaryPerBar = primaryResource.quantityPerBar || 1;
              const secondaryPerBar = secondaryResource.quantityPerBar || 1;
              const outputQty = craftable.barCrafting.outputQuantity || 1;
              
              // Ajouter cette information au craftable
              craftable.craftRatio = {
                primaryName: primaryResource.name,
                secondaryName: secondaryResource.name,
                primaryPerBar,
                secondaryPerBar,
                outputQuantity: outputQty,
                craftsNeeded: Math.ceil(craftable.quantity / outputQty),
                ratio: secondaryPerBar / primaryPerBar
              };
            }
          }
        });
        
        // Fusionner toutes les ressources en une seule liste
        const allResources = [...resourcesMap.values(), ...craftableResourcesMap.values()];
        
        // Pour chaque ressource craftable, ajouter les informations de craft et de composants
        allResources.forEach(resource => {
          // Pour un craftable, ajouter les composants et ratios
          if (resource.isCraftable && resource.craftComponents) {
            // Déjà fait lors du traitement précédent
          }
          
          // Ne pas ajouter d'information usedIn dans les matières premières
          // Toutes les informations sont déjà dans le craftable
        });
        
        setResourceList(allResources);
      } catch (error) {
        console.error("Erreur lors du chargement des ressources:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [professions]);
  
  // Filtrer les ressources selon l'onglet actif
  const filteredResources = resourceList.filter(resource => {
    if (activeTab === 'all') return true;
    if (activeTab === 'checked') return checkedResources[resource.id];
    if (activeTab === 'unchecked') return !checkedResources[resource.id];
    if (activeTab === 'craft') return resource.isCraftable;
    if (activeTab === 'raw') return !resource.isCraftable;
    return true;
  });
  
  // Calculer le pourcentage de complétion
  const completionPercentage = resourceList.length > 0
    ? Math.round((Object.values(checkedResources).filter(Boolean).length / resourceList.length) * 100)
    : 0;
  
  // Organiser les ressources par catégorie
  const resourcesByCategory = {};
  filteredResources.forEach(resource => {
    const category = resource.categoryId || 'other';
    if (!resourcesByCategory[category]) {
      resourcesByCategory[category] = [];
    }
    resourcesByCategory[category].push(resource);
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ressources à collecter</CardTitle>
            <CardDescription>
              Liste des ressources nécessaires pour cette commande (quantités cumulées)
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">
              Progression: {completionPercentage}%
            </div>
            <Progress value={completionPercentage} className="w-[100px]" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="raw">Matières Premières</TabsTrigger>
            <TabsTrigger value="craft">Produits Craftables</TabsTrigger>
            <TabsTrigger value="unchecked">À collecter</TabsTrigger>
            <TabsTrigger value="checked">Collectées</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement des ressources...
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune ressource trouvée
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(resourcesByCategory).map(([category, resources]) => (
              <div key={category} className="space-y-2">
                <h3 className="font-medium text-lg">{category === 'other' ? 'Autres ressources' : category}</h3>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">État</TableHead>
                      <TableHead>Ressource</TableHead>
                      <TableHead>Profession</TableHead>
                      <TableHead>Utilisation</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((resource) => (
                      <TableRow 
                        key={resource.id} 
                        className={`
                          ${checkedResources[resource.id] ? "bg-green-50 dark:bg-green-950/20" : ""}
                          ${resource.isPrimaryResource || resource.isSecondaryResource ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}
                        `}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={!!checkedResources[resource.id]} 
                            onCheckedChange={(checked) => onToggleResource(resource.id, checked)}
                          />
                        </TableCell>
                        <TableCell className={`font-medium ${checkedResources[resource.id] ? "text-green-600 dark:text-green-400 line-through" : ""}`}>
                          <div className="flex items-center">
                            {resource.iconName && (
                              <img 
                                src={`https://wow.zamimg.com/images/wow/icons/small/${resource.iconName.toLowerCase()}.jpg`}
                                alt={resource.name}
                                className="w-6 h-6 mr-2 rounded"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                }}
                              />
                            )}
                            {resource.name}
                            {resource.isCraftable && (
                              <Badge className="ml-2" variant="outline">Craftable</Badge>
                            )}
                            {(resource.isPrimaryResource || resource.isSecondaryResource) && (
                              <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">Auto-généré</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {resource.professions && resource.professions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {resource.professions.map((prof, idx) => (
                                <Badge key={idx} variant="outline">{prof}</Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="outline">{resource.profession}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* Afficher les informations de craft uniquement pour les ressources craftables */}
                          {resource.isCraftable && (
                            <div className="flex flex-col gap-1">
                              {/* Affichage des composants requis pour ce craftable */}
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Recette:</span>
                              </div>
                              
                              {/* Montrer la recette de craft avec prise en compte du outputQuantity */}
                              {resource.craftComponents && resource.craftComponents.length > 0 && (
                                <div className="flex items-center text-xs gap-1">
                                  {resource.craftComponents.map((component, index) => (
                                    <React.Fragment key={index}>
                                      {index > 0 && <span>+</span>}
                                      <div className="flex items-center">
                                        <span>
                                          {/* Calculer la quantité par unité de produit */}
                                          {component.quantity / resource.craftRatio.craftsNeeded}x {component.name}
                                        </span>
                                      </div>
                                    </React.Fragment>
                                  ))}
                                  <ArrowRight className="h-3 w-3 mx-1" />
                                  <span>
                                    {/* Afficher la quantité produite par craft */}
                                    {resource.craftRatio?.outputQuantity || 1}x {resource.name}
                                  </span>
                                </div>
                              )}
                              
                              {/* Affichage des composants totaux nécessaires */}
                              {resource.quantity > 1 && resource.craftComponents && resource.craftComponents.length > 0 && (
                                <div className="mt-1 p-1 bg-muted/20 rounded text-xs">
                                  <div className="font-medium">
                                    Pour {resource.quantity} {resource.name} 
                                    {resource.craftRatio?.outputQuantity > 1 ? 
                                      ` (${resource.craftRatio.craftsNeeded} crafts)` : ''}:
                                  </div>
                                  {resource.craftComponents.map((component, index) => (
                                    <div key={index}>
                                      - {component.quantity}x {component.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Afficher les informations de ratio avec outputQuantity */}
                              {resource.craftRatio && (
                                <div className="mt-1 p-1 bg-muted/20 rounded text-xs">
                                  <div className="font-medium mb-1">
                                    Proportions des composants:
                                  </div>
                                  <div>
                                    {resource.craftRatio.primaryPerBar}x {resource.craftRatio.primaryName} + 
                                    {resource.craftRatio.secondaryPerBar}x {resource.craftRatio.secondaryName} = 
                                    {resource.craftRatio.outputQuantity > 1 ? 
                                      <strong> {resource.craftRatio.outputQuantity}x </strong> : " "}
                                    {resource.name}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* N'afficher AUCUNE information d'utilisation sur les matières premières */}
                          {!resource.isCraftable && "-"}
                        </TableCell>
                        <TableCell className="text-right">{resource.quantity}</TableCell>
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
  );
}
