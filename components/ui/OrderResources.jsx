'use client';

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
        
        // Objet pour suivre les ressources cumulées par nom
        const resourcesMap = new Map();
        const craftableResourcesMap = new Map();
        
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
            
            // Stocker les ressources craftables séparément pour traitement ultérieur
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
        
        // Convertir les Maps en arrays
        const allResources = [...resourcesMap.values()];
        const craftableResources = [...craftableResourcesMap.values()];
        
        // Deuxième passage pour ajouter les relations de craft avec quantités cumulées
        craftableResources.forEach(craftable => {
          // Traiter la ressource primaire
          if (craftable.barCrafting.primaryResource && craftable.barCrafting.primaryResource.name) {
            const primary = craftable.barCrafting.primaryResource;
            const primaryName = primary.name;
            
            // Trouver si la ressource primaire est déjà dans notre liste
            const existingPrimary = allResources.find(r => 
              r.name.toLowerCase() === primaryName.toLowerCase()
            );
            
            // Calculer la quantité totale nécessaire pour tous les craftables
            const totalQuantityNeeded = craftable.quantity * (primary.quantityPerBar || 1);
            
            if (existingPrimary) {
              // Ajouter l'info que cette ressource est utilisée dans un craft
              if (!existingPrimary.usedIn) existingPrimary.usedIn = [];
              
              // Vérifier si ce craftable est déjà référencé
              const existingUsage = existingPrimary.usedIn.find(u => u.outputName === craftable.name);
              
              if (existingUsage) {
                // Cumuler la quantité nécessaire
                existingUsage.quantityNeeded += totalQuantityNeeded;
                existingUsage.instances = (existingUsage.instances || 1) + 1;
              } else {
                // Ajouter une nouvelle référence
                existingPrimary.usedIn.push({
                  outputId: craftable.id,
                  outputName: craftable.name,
                  quantityNeeded: totalQuantityNeeded,
                  iconName: craftable.iconName,
                  instances: 1 // Nombre d'instances de ce craft
                });
              }
            } else {
              // Ajouter comme nouvelle ressource
              const newResourceId = primary.materialId || `${primaryName}-resource`;
              const newResource = {
                id: newResourceId,
                name: primaryName,
                iconName: primary.iconName,
                quantity: totalQuantityNeeded,
                isPrimaryResource: true,
                profession: craftable.profession,
                professions: craftable.professions,
                levelRange: craftable.levelRange,
                usedIn: [{
                  outputId: craftable.id,
                  outputName: craftable.name,
                  quantityNeeded: totalQuantityNeeded,
                  iconName: craftable.iconName,
                  instances: 1
                }]
              };
              
              allResources.push(newResource);
            }
          }
          
          // Même logique pour les ressources secondaires
          if (craftable.barCrafting.hasSecondaryResource && 
              craftable.barCrafting.secondaryResource && 
              craftable.barCrafting.secondaryResource.name) {
            
            const secondary = craftable.barCrafting.secondaryResource;
            const secondaryName = secondary.name;
            
            // Calculer la quantité totale nécessaire pour tous les craftables
            const totalQuantityNeeded = craftable.quantity * (secondary.quantityPerBar || 1);
            
            // Vérifier si cette ressource existe déjà
            const existingSecondary = allResources.find(r => 
              r.name.toLowerCase() === secondaryName.toLowerCase()
            );
            
            if (existingSecondary) {
              // Ajouter l'info que cette ressource est utilisée dans un craft
              if (!existingSecondary.usedIn) existingSecondary.usedIn = [];
              
              // Vérifier si ce craftable est déjà référencé
              const existingUsage = existingSecondary.usedIn.find(u => u.outputName === craftable.name);
              
              if (existingUsage) {
                // Cumuler la quantité nécessaire
                existingUsage.quantityNeeded += totalQuantityNeeded;
                existingUsage.instances = (existingUsage.instances || 1) + 1;
              } else {
                // Ajouter une nouvelle référence
                existingSecondary.usedIn.push({
                  outputId: craftable.id,
                  outputName: craftable.name,
                  quantityNeeded: totalQuantityNeeded,
                  iconName: craftable.iconName,
                  isSecondaryResource: true,
                  instances: 1
                });
              }
            } else {
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
                levelRange: craftable.levelRange,
                usedIn: [{
                  outputId: craftable.id,
                  outputName: craftable.name,
                  quantityNeeded: totalQuantityNeeded,
                  iconName: craftable.iconName,
                  isSecondaryResource: true,
                  instances: 1
                }]
              };
              
              allResources.push(newResource);
            }
          }

          // Après avoir traité les ressources principales et secondaires, ajouter les informations de ratio
          if (craftable.barCrafting.primaryResource && 
              craftable.barCrafting.hasSecondaryResource && 
              craftable.barCrafting.secondaryResource) {
            
            const primaryResource = craftable.barCrafting.primaryResource;
            const secondaryResource = craftable.barCrafting.secondaryResource;
            
            // Trouver les ressources dans notre liste
            const primaryInList = allResources.find(r => 
              r.name.toLowerCase() === primaryResource.name.toLowerCase()
            );
            
            const secondaryInList = allResources.find(r => 
              r.name.toLowerCase() === secondaryResource.name.toLowerCase()
            );
            
            if (primaryInList && secondaryInList) {
              // Calculer le ratio: combien de ressource secondaire pour 1 de ressource primaire
              const primaryPerBar = primaryResource.quantityPerBar || 1;
              const secondaryPerBar = secondaryResource.quantityPerBar || 1;
              
              const ratio = secondaryPerBar / primaryPerBar;
              
              // Ajouter cette information aux deux ressources
              primaryInList.craftRatio = {
                ratio,
                targetResource: secondaryResource.name,
                primaryPerBar,
                secondaryPerBar
              };
              
              secondaryInList.craftRatio = {
                ratio: 1 / ratio,  // Ratio inverse pour la ressource secondaire
                targetResource: primaryResource.name,
                primaryPerBar,
                secondaryPerBar,
                isSecondary: true
              };
            }
          }
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
    if (activeTab === 'raw') return !resource.isCraftable && !resource.usedIn;
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
                          {resource.usedIn && resource.usedIn.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {resource.usedIn.map((usage, idx) => (
                                <div key={idx} className="flex items-center text-xs text-muted-foreground">
                                  <span>{usage.quantityNeeded}x</span>
                                  <ArrowRight className="h-3 w-3 mx-1" />
                                  {usage.iconName && (
                                    <img 
                                      src={`https://wow.zamimg.com/images/wow/icons/small/${usage.iconName.toLowerCase()}.jpg`}
                                      alt={usage.outputName}
                                      className="w-4 h-4 mr-1 rounded"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                      }}
                                    />
                                  )}
                                  <span>{usage.outputName}</span>
                                  {usage.instances > 1 && (
                                    <Badge className="ml-1 px-1 py-0 h-4 text-[0.6rem]" variant="outline">
                                      x{usage.instances}
                                    </Badge>
                                  )}
                                  {usage.isSecondaryResource && (
                                    <Badge className="ml-1 px-1 py-0 h-4 text-[0.6rem]" variant="secondary">Secondaire</Badge>
                                  )}
                                </div>
                              ))}
                              
                              {resource.craftRatio && (
                                <div className="mt-1 p-1 bg-muted/20 rounded text-xs">
                                  {resource.usedIn && resource.usedIn[0] && (
                                    <div className="font-medium mb-1">
                                      Pour fabriquer {resource.usedIn[0].outputName}:
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">{resource.craftRatio.primaryPerBar}x</span> {resource.craftRatio.isSecondary ? resource.craftRatio.targetResource : resource.name} +
                                    <span className="font-medium"> {resource.craftRatio.secondaryPerBar}x</span> {resource.craftRatio.isSecondary ? resource.name : resource.craftRatio.targetResource} 
                                    <span> = 1 barre</span>
                                  </div>
                                  {resource.quantity > 1 && (
                                    <div className="text-[10px] text-muted-foreground mt-1">
                                      Pour {resource.quantity}x {resource.name}, vous aurez besoin d'environ 
                                      {resource.craftRatio.isSecondary 
                                        ? ` ${Math.ceil(resource.quantity * resource.craftRatio.ratio)}x ${resource.craftRatio.targetResource}`
                                        : ` ${Math.ceil(resource.quantity * resource.craftRatio.ratio)}x ${resource.craftRatio.targetResource}`
                                      }
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : resource.isCraftable ? (
                            <div className="flex flex-col gap-1">
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Recette:</span>
                              </div>
                              <div className="flex items-center text-xs gap-1">
                                {resource.barCrafting?.primaryResource && (
                                  <div className="flex items-center">
                                    <span>{resource.barCrafting.primaryResource.quantityPerBar}x {resource.barCrafting.primaryResource.name}</span>
                                  </div>
                                )}
                                {resource.barCrafting?.hasSecondaryResource && resource.barCrafting?.secondaryResource && (
                                  <>
                                    <span>+</span>
                                    <div className="flex items-center">
                                      <span>{resource.barCrafting.secondaryResource.quantityPerBar}x {resource.barCrafting.secondaryResource.name}</span>
                                    </div>
                                  </>
                                )}
                                <ArrowRight className="h-3 w-3 mx-1" />
                                <span>1x {resource.name}</span>
                              </div>
                              
                              {resource.quantity > 1 && (
                                <div className="mt-1 p-1 bg-muted/20 rounded text-xs">
                                  <div className="font-medium">Pour {resource.quantity} {resource.name}:</div>
                                  <div>
                                    - {resource.quantity * (resource.barCrafting?.primaryResource?.quantityPerBar || 1)}x {resource.barCrafting?.primaryResource?.name || "ressource"}
                                  </div>
                                  {resource.barCrafting?.hasSecondaryResource && resource.barCrafting?.secondaryResource && (
                                    <div>
                                      - {resource.quantity * (resource.barCrafting?.secondaryResource?.quantityPerBar || 1)}x {resource.barCrafting?.secondaryResource?.name || "ressource"}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {resource.originalQuantity && resource.quantity > resource.originalQuantity && (
                                <div className="mt-1 p-1 bg-amber-50 text-amber-800 rounded text-xs">
                                  <div>Cumulé sur {Math.round(resource.quantity / resource.originalQuantity)} crafts</div>
                                </div>
                              )}
                            </div>
                          ) : "-"}
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
