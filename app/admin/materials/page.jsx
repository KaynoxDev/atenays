'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useGet, apiPost, apiPut, apiDelete } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Edit, Plus, Save, Trash2, RefreshCw, Tag, X, Search } from 'lucide-react';
import Link from 'next/link';

export default function AdminMaterialsPage() {
  const { data: materials = [], loading, error: apiError, refetch } = useGet('/api/materials');
  const { data: categories = [] } = useGet('/api/material-categories');
  const { data: professions = [] } = useGet('/api/professions');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Initialize with safe default values to prevent the TypeError
  const defaultMaterial = {
    name: '',
    iconName: '',
    quantity: 1,
    categoryId: 'none',
    profession: 'none',
    professions: [],
    levelRange: '525',
    requiredBy: [],
    isBar: false,
    barCrafting: {
      primaryResource: {
        name: '',
        materialId: '',
        iconName: '',
        quantityPerBar: 0
      },
      secondaryResource: {
        name: '',
        materialId: '',
        iconName: '',
        quantityPerBar: 0
      },
      hasSecondaryResource: false,
      outputQuantity: 1 // Valeur par défaut
    }
  };
  
  const [currentMaterial, setCurrentMaterial] = useState(defaultMaterial);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // États sécurisés, même si les données de l'API sont nulles
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  // Filtrage des matériaux par nom, catégorie et onglet
  const filteredMaterials = safeMaterials.filter(material => {
    const matchesSearch = !searchQuery || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || 
      material.categoryId === categoryFilter;
      
    let matchesTab = true;
    if (activeTab === 'bars') {
      matchesTab = material.isBar === true;
    } else if (activeTab === 'resources') {
      matchesTab = material.isBar !== true;
    }
    
    return matchesSearch && matchesCategory && matchesTab;
  });
  
  // Trouver la catégorie par ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Non catégorisé';
    const category = safeCategories.find(c => c._id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  };
  
  // Ajouter un nouveau matériau
  const handleAddNew = () => {
    // Use the safe default material object
    setCurrentMaterial({...defaultMaterial});
    setIsDialogOpen(true);
  };
  
  // Éditer un matériau existant
  const handleEdit = (material) => {
    // Make sure to properly initialize barCrafting if it doesn't exist
    const materialCopy = JSON.parse(JSON.stringify(material));
    
    // Ensure barCrafting and its nested properties exist
    if (!materialCopy.barCrafting) {
      materialCopy.barCrafting = {
        primaryResource: {
          name: '',
          materialId: '',
          iconName: '',
          quantityPerBar: 0
        },
        secondaryResource: {
          name: '',
          materialId: '',
          iconName: '',
          quantityPerBar: 0
        },
        hasSecondaryResource: false,
        outputQuantity: 1 // Valeur par défaut
      };
    } else {
      // Ensure primaryResource exists
      if (!materialCopy.barCrafting.primaryResource) {
        materialCopy.barCrafting.primaryResource = {
          name: '',
          materialId: '',
          iconName: '',
          quantityPerBar: 0
        };
      }
      
      // Ensure secondaryResource exists
      if (!materialCopy.barCrafting.secondaryResource) {
        materialCopy.barCrafting.secondaryResource = {
          name: '',
          materialId: '',
          iconName: '',
          quantityPerBar: 0
        };
      }

      // Ensure outputQuantity exists
      if (!materialCopy.barCrafting.outputQuantity) {
        materialCopy.barCrafting.outputQuantity = 1; // Valeur par défaut
      }
    }
    
    // Make sure categoryId and profession are set to 'none' if empty
    if (!materialCopy.categoryId) materialCopy.categoryId = 'none';
    if (!materialCopy.profession) materialCopy.profession = 'none';
    
    setCurrentMaterial(materialCopy);
    setIsDialogOpen(true);
  };
  
  // Préparer la suppression d'un matériau
  const handleDelete = (material) => {
    setCurrentMaterial(material);
    setIsDeleteDialogOpen(true);
  };
  
  // Traitement des erreurs API
  useEffect(() => {
    if (apiError) {
      toast({
        title: "Erreur de chargement",
        description: apiError.message || "Impossible de charger les matériaux",
        variant: "destructive"
      });
    }
  }, [apiError, toast]);
  
  // Gérer les entrées du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMaterial(prev => ({ ...prev, [name]: value }));
  };
  
  // Gérer les sélections
  const handleSelectChange = (name, value) => {
    setCurrentMaterial(prev => {
      const updated = { ...prev, [name]: value };
      
      // Mise à jour supplémentaire pour la profession
      if (name === 'profession' && value) {
        updated.professions = [...new Set([...prev.professions, value])];
      }
      
      return updated;
    });
  };
  
  // Sauvegarder le matériau (ajout ou modification)
  const handleSave = async () => {
    if (!currentMaterial.name) {
      toast({
        title: "Champ requis manquant",
        description: "Le nom du matériau est requis",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const materialToSave = { 
        ...currentMaterial,
        quantity: parseInt(currentMaterial.quantity) || 1
      };
      
      // S'assurer que professions est un tableau et inclut la profession principale si définie
      const professions = Array.isArray(materialToSave.professions) ? [...materialToSave.professions] : [];
      
      // Ajouter la profession principale au tableau professions si elle existe et n'est pas déjà incluse
      if (materialToSave.profession && materialToSave.profession !== 'none' && !professions.includes(materialToSave.profession)) {
        professions.push(materialToSave.profession);
      }
      
      // Préparer les données à envoyer
      const materialToSubmit = {
        ...materialToSave,
        professions, // Utiliser le tableau mis à jour
      };
      
      if (currentMaterial._id) {
        await apiPut(`/api/materials/${currentMaterial._id}`, materialToSubmit);
        toast({
          title: "Matériau mis à jour",
          description: `${currentMaterial.name} a été mis à jour`
        });
      } else {
        await apiPost('/api/materials', materialToSubmit);
        toast({
          title: "Matériau ajouté",
          description: `${currentMaterial.name} a été ajouté`
        });
      }
      
      setIsDialogOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };
  
  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    try {
      await apiDelete(`/api/materials/${currentMaterial._id}`);
      toast({
        title: "Matériau supprimé",
        description: `${currentMaterial.name} a été supprimé`
      });
      setIsDeleteDialogOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestion des Matériaux</h1>
          <p className="text-muted-foreground">
            Gérez les matériaux disponibles pour le calculateur
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/admin/material-categories">
            <Button variant="secondary">
              <Tag className="h-4 w-4 mr-2" />
              Gérer les catégories
            </Button>
          </Link>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau matériau
          </Button>
        </div>
      </div>
      
      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un matériau..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-[200px]">
              <Select 
                value={categoryFilter} 
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Toutes catégories</SelectItem>
                  {safeCategories.map(category => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="resources">Ressources</TabsTrigger>
                <TabsTrigger value="bars">Barres</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
      {/* Liste des matériaux */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des matériaux</CardTitle>
          <CardDescription>
            {filteredMaterials.length} matériaux affichés sur {safeMaterials.length} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '50px' }}></TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead style={{ width: '100px' }} className="text-center">Quantité</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.length > 0 ? (
                  filteredMaterials.map((material) => (
                    <TableRow key={material._id}>
                      <TableCell>
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
                          <div className="w-8 h-8 bg-muted flex items-center justify-center rounded">?</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{material.name}</div>
                        <div className="text-xs text-muted-foreground">{material.iconName || 'Pas d\'icône'}</div>
                      </TableCell>
                      <TableCell>
                        {getCategoryName(material.categoryId)}
                      </TableCell>
                      <TableCell>
                        {material.isBar ? (
                          <Badge>Produit fabriqué</Badge>
                        ) : (
                          <Badge variant="outline">Ressource</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{material.quantity || 1}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(material)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(material)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {loading ? "Chargement des matériaux..." : "Aucun matériau trouvé"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogue pour ajouter/modifier un matériau */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentMaterial?._id ? `Modifier ${currentMaterial.name}` : 'Ajouter un matériau'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du matériau ci-dessous.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <Tabs defaultValue="basics" className="w-full">
              <TabsList>
                <TabsTrigger value="basics">Informations de base</TabsTrigger>
                {currentMaterial?.isBar && (
                  <TabsTrigger value="crafting">Informations de craft</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="basics" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du matériau <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      value={currentMaterial?.name || ''}
                      onChange={handleInputChange}
                      placeholder="Nom du matériau"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="iconName">Nom de l'icône</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          id="iconName"
                          name="iconName"
                          value={currentMaterial?.iconName || ''}
                          onChange={handleInputChange}
                          placeholder="ex: inv_misc_herb_01"
                        />
                      </div>
                      {currentMaterial?.iconName && (
                        <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-md">
                          <img 
                            src={`https://wow.zamimg.com/images/wow/icons/medium/${currentMaterial.iconName.toLowerCase()}.jpg`}
                            alt="Icon preview"
                            className="w-8 h-8 rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Catégorie</Label>
                    <Select 
                      value={currentMaterial?.categoryId || 'none'} 
                      onValueChange={(value) => handleSelectChange('categoryId', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non catégorisé</SelectItem>
                        {safeCategories.map(category => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.icon && <span className="mr-2">{category.icon}</span>}
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité par défaut</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={currentMaterial?.quantity || 1}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession principale</Label>
                    <Select 
                      value={currentMaterial?.profession || 'none'} 
                      onValueChange={(value) => handleSelectChange('profession', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une profession" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune profession</SelectItem>
                        {professions && professions.map(profession => (
                          <SelectItem key={profession._id} value={profession.name}>
                            {profession.icon && <span className="mr-2">{profession.icon}</span>}
                            {profession.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="levelRange">Plage de niveau</Label>
                    <Select 
                      value={currentMaterial?.levelRange || '525'} 
                      onValueChange={(value) => handleSelectChange('levelRange', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un niveau" />
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
                
                <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                  <Switch 
                    id="isBar" 
                    checked={currentMaterial?.isBar || false}
                    onCheckedChange={(checked) => {
                      setCurrentMaterial(prev => ({ ...prev, isBar: checked }));
                    }}
                  />
                  <Label htmlFor="isBar">Ce matériau est un produit fabriqué (barre, objet crafté...)</Label>
                </div>
              </TabsContent>
              
              {currentMaterial?.isBar && (
                <TabsContent value="crafting" className="space-y-6 mt-4">
                  <div className="space-y-4 border p-4 rounded-md">
                    <div className="font-medium">Ressource Principale</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryResourceName">Nom</Label>
                        <Input
                          id="primaryResourceName"
                          value={currentMaterial?.barCrafting?.primaryResource?.name || ''}
                          onChange={(e) => {
                            setCurrentMaterial(prev => ({
                              ...prev,
                              barCrafting: {
                                ...prev.barCrafting,
                                primaryResource: {
                                  ...prev.barCrafting.primaryResource,
                                  name: e.target.value
                                }
                              }
                            }));
                          }}
                          placeholder="Nom de la ressource"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="primaryResourceIcon">Icône</Label>
                        <Input
                          id="primaryResourceIcon"
                          value={currentMaterial?.barCrafting?.primaryResource?.iconName || ''}
                          onChange={(e) => {
                            setCurrentMaterial(prev => ({
                              ...prev,
                              barCrafting: {
                                ...prev.barCrafting,
                                primaryResource: {
                                  ...prev.barCrafting.primaryResource,
                                  iconName: e.target.value
                                }
                              }
                            }));
                          }}
                          placeholder="inv_ore_copper_01"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="primaryResourceQty">Quantité par unité</Label>
                        <Input
                          id="primaryResourceQty"
                          type="number"
                          min="1"
                          value={currentMaterial?.barCrafting?.primaryResource?.quantityPerBar || ''}
                          onChange={(e) => {
                            setCurrentMaterial(prev => ({
                              ...prev,
                              barCrafting: {
                                ...prev.barCrafting,
                                primaryResource: {
                                  ...prev.barCrafting.primaryResource,
                                  quantityPerBar: parseInt(e.target.value) || 0
                                }
                              }
                            }));
                          }}
                          placeholder="Ex: 2"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="hasSecondaryResource"
                      checked={currentMaterial?.barCrafting?.hasSecondaryResource || false}
                      onCheckedChange={(checked) => {
                        setCurrentMaterial(prev => ({
                          ...prev,
                          barCrafting: {
                            ...prev.barCrafting,
                            hasSecondaryResource: checked,
                            secondaryResource: checked ? 
                              prev.barCrafting.secondaryResource : 
                              { name: '', iconName: '', quantityPerBar: 0 }
                          }
                        }));
                      }}
                    />
                    <Label htmlFor="hasSecondaryResource">Nécessite une ressource secondaire</Label>
                  </div>
                  
                  {currentMaterial?.barCrafting?.hasSecondaryResource && (
                    <div className="space-y-4 border p-4 rounded-md border-l-4 border-l-primary/30">
                      <div className="font-medium">Ressource Secondaire</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="secondaryResourceName">Nom</Label>
                          <Input
                            id="secondaryResourceName"
                            value={currentMaterial?.barCrafting?.secondaryResource?.name || ''}
                            onChange={(e) => {
                              setCurrentMaterial(prev => ({
                                ...prev,
                                barCrafting: {
                                  ...prev.barCrafting,
                                  secondaryResource: {
                                    ...prev.barCrafting.secondaryResource,
                                    name: e.target.value
                                  }
                                }
                              }));
                            }}
                            placeholder="Nom de la ressource"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="secondaryResourceIcon">Icône</Label>
                          <Input
                            id="secondaryResourceIcon"
                            value={currentMaterial?.barCrafting?.secondaryResource?.iconName || ''}
                            onChange={(e) => {
                              setCurrentMaterial(prev => ({
                                ...prev,
                                barCrafting: {
                                  ...prev.barCrafting,
                                  secondaryResource: {
                                    ...prev.barCrafting.secondaryResource,
                                    iconName: e.target.value
                                  }
                                }
                              }));
                            }}
                            placeholder="inv_ore_tin_01"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="secondaryResourceQty">Quantité par unité</Label>
                          <Input
                            id="secondaryResourceQty"
                            type="number"
                            min="1"
                            value={currentMaterial?.barCrafting?.secondaryResource?.quantityPerBar || ''}
                            onChange={(e) => {
                              setCurrentMaterial(prev => ({
                                ...prev,
                                barCrafting: {
                                  ...prev.barCrafting,
                                  secondaryResource: {
                                    ...prev.barCrafting.secondaryResource,
                                    quantityPerBar: parseInt(e.target.value) || 0
                                  }
                                }
                              }));
                            }}
                            placeholder="Ex: 1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 border-t pt-4 mt-4">
                    <Label htmlFor="outputQuantity">Quantité produite par craft</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="outputQuantity"
                        type="number"
                        min="1"
                        value={currentMaterial.barCrafting?.outputQuantity || 1}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setCurrentMaterial(prev => ({
                            ...prev,
                            barCrafting: {
                              ...prev.barCrafting,
                              outputQuantity: value > 0 ? value : 1
                            }
                          }));
                        }}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        Nombre d'unités produites à chaque craft
                      </span>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer le matériau <strong>{currentMaterial?.name}</strong> ?
          </p>
          <p className="text-muted-foreground mt-2">
            Cette action est irréversible et pourrait affecter les calculs existants.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}