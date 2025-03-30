'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useGet, apiPost } from '@/hooks/useApi';
import { ArrowLeft, Save, X, Package, ArrowRight, Plus, Search, Filter, Trash } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { forceTheme } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AddMaterialPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("basic"); // "basic" ou "crafting"
  
  // Force le thème clair pour cette page
  useEffect(() => {
    forceTheme('light');
    
    // Restaurer le thème précédent à la sortie
    return () => {
      const savedTheme = localStorage.getItem('theme') || 'light';
      forceTheme(savedTheme);
    };
  }, []);
  
  // Données des API
  const { data: categories = [] } = useGet('/api/material-categories');
  const { data: professions = [] } = useGet('/api/professions');
  const { data: allMaterials = [] } = useGet('/api/materials');
  
  // État du matériau
  const [material, setMaterial] = useState({
    name: '',
    iconName: '',
    quantity: 1,
    categoryId: '',
    profession: '',
    professions: [],
    levelRange: '525',
    requiredBy: [],
    isBar: false,
    barCrafting: {
      outputQuantity: 1, // Nouvel attribut: nombre d'objets produits par craft
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
      craftAlternatives: [] // Liste d'alternatives de craft
    }
  });
  
  // État des recherches pour les ressources
  const [primarySearch, setPrimarySearch] = useState('');
  const [secondarySearch, setSecondarySearch] = useState('');
  
  // Ajouter des références pour les listes déroulantes
  const primaryDropdownRef = useRef(null);
  const secondaryDropdownRef = useRef(null);

  // Filtres supplémentaires pour la recherche
  const [primaryFilters, setPrimaryFilters] = useState({ 
    category: '',
    profession: ''
  });
  const [secondaryFilters, setSecondaryFilters] = useState({ 
    category: '', 
    profession: '' 
  });
  
  // État pour indiquer si les filtres sont actifs
  const [primaryFiltersActive, setPrimaryFiltersActive] = useState(false);
  const [secondaryFiltersActive, setSecondaryFiltersActive] = useState(false);

  // État pour le focus du champ de recherche
  const [primarySearchFocused, setPrimarySearchFocused] = useState(false);
  const [secondarySearchFocused, setSecondarySearchFocused] = useState(false);
  
  // Pour les champs simples
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMaterial(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setMaterial(prev => {
      const updated = { ...prev, [name]: value };
      
      // Mise à jour supplémentaire pour la profession
      if (name === 'profession' && value) {
        updated.professions = [...new Set([...prev.professions, value])];
        updated.requiredBy = [...new Set([...prev.requiredBy, value])];
      }
      
      return updated;
    });
  };
  
  // Activer/désactiver la fabrication
  const toggleIsBar = (checked) => {
    setMaterial(prev => ({ ...prev, isBar: checked }));
    if (checked) setActiveSection("crafting");
  };
  
  // Activer/désactiver la ressource secondaire
  const toggleSecondaryResource = (checked) => {
    setMaterial(prev => ({
      ...prev,
      barCrafting: {
        ...prev.barCrafting,
        hasSecondaryResource: checked,
        secondaryResource: checked ? prev.barCrafting.secondaryResource : {
          name: '',
          materialId: '',
          iconName: '',
          quantityPerBar: 0
        }
      }
    }));
  };
  
  // Ressource primaire - recherche filtrée améliorée
  const filteredPrimaryMaterials = useMemo(() => {
    console.log("Filtrage des ressources avec terme:", primarySearch);
    
    if (!Array.isArray(allMaterials)) {
      return [];
    }
    
    if (primarySearch.length === 0 && !primarySearchFocused) return [];
    
    // Filtrer les matériaux
    return allMaterials
      .filter(m => {
        // Recherche insensible à la casse
        const searchTerm = primarySearch.toLowerCase().trim();
        const materialName = (m.name || '').toLowerCase();
        
        // Accepter tous les matériaux si le champ de recherche est vide mais a le focus
        if (searchTerm.length === 0 && primarySearchFocused) return true;
        
        // Vérifier si le nom contient le terme de recherche
        const matchesName = materialName.includes(searchTerm);
        
        // Appliquer les filtres supplémentaires si actifs
        if (primaryFiltersActive) {
          const categoryMatches = !primaryFilters.category || m.categoryId === primaryFilters.category;
          const professionMatches = !primaryFilters.profession || 
            (m.profession === primaryFilters.profession || 
            (m.professions && m.professions.includes(primaryFilters.profession)));
          
          return matchesName && categoryMatches && professionMatches;
        }
        
        return matchesName;
      })
      .sort((a, b) => {
        // Trier les résultats: d'abord ceux qui commencent par le terme recherché
        const searchTerm = primarySearch.toLowerCase().trim();
        
        // Si recherche vide avec focus, trier par nom
        if (searchTerm.length === 0) return a.name.localeCompare(b.name);
        
        const aStartsWith = a.name.toLowerCase().startsWith(searchTerm);
        const bStartsWith = b.name.toLowerCase().startsWith(searchTerm);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 15);
  }, [allMaterials, primarySearch, primarySearchFocused, primaryFiltersActive, primaryFilters]);

  // Ressource secondaire - recherche filtrée améliorée (même logique)
  const filteredSecondaryMaterials = useMemo(() => {
    if (!Array.isArray(allMaterials)) {
      return [];
    }
    
    if (secondarySearch.length === 0 && !secondarySearchFocused) return [];
    
    return allMaterials
      .filter(m => {
        const searchTerm = secondarySearch.toLowerCase().trim();
        const materialName = (m.name || '').toLowerCase();
        
        // Accepter tous les matériaux si le champ de recherche est vide mais a le focus
        if (searchTerm.length === 0 && secondarySearchFocused) return true;
        
        const matchesName = materialName.includes(searchTerm);
        
        if (secondaryFiltersActive) {
          const categoryMatches = !secondaryFilters.category || m.categoryId === secondaryFilters.category;
          const professionMatches = !secondaryFilters.profession || 
            (m.profession === secondaryFilters.profession || 
            (m.professions && m.professions.includes(secondaryFilters.profession)));
          
          return matchesName && categoryMatches && professionMatches;
        }
        
        return matchesName;
      })
      .sort((a, b) => {
        const searchTerm = secondarySearch.toLowerCase().trim();
        
        if (searchTerm.length === 0) return a.name.localeCompare(b.name);
        
        const aStartsWith = a.name.toLowerCase().startsWith(searchTerm);
        const bStartsWith = b.name.toLowerCase().startsWith(searchTerm);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 15);
  }, [allMaterials, secondarySearch, secondarySearchFocused, secondaryFiltersActive, secondaryFilters]);

  // Obtenir le nom d'une catégorie par ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Non catégorisé';
    if (!Array.isArray(categories)) return 'Catégorie inconnue';
    const category = categories.find(c => c._id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  };

  // Fermer les listes déroulantes lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (primaryDropdownRef.current && !primaryDropdownRef.current.contains(event.target)) {
        setPrimarySearchFocused(false);
      }
      if (secondaryDropdownRef.current && !secondaryDropdownRef.current.contains(event.target)) {
        setSecondarySearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
    
  // Sélectionner une ressource primaire
  const selectPrimaryResource = (resource) => {
    setMaterial(prev => ({
      ...prev,
      barCrafting: {
        ...prev.barCrafting,
        primaryResource: {
          name: resource.name,
          materialId: resource._id,
          iconName: resource.iconName || '',
          quantityPerBar: prev.barCrafting.primaryResource.quantityPerBar || 1
        }
      }
    }));
    setPrimarySearch('');
  };
  
  // Effacer la ressource primaire
  const clearPrimaryResource = () => {
    setMaterial(prev => ({
      ...prev,
      barCrafting: {
        ...prev.barCrafting,
        primaryResource: {
          name: '',
          materialId: '',
          iconName: '',
          quantityPerBar: 0
        }
      }
    }));
  };
  
  // Sélectionner une ressource secondaire
  const selectSecondaryResource = (resource) => {
    setMaterial(prev => ({
      ...prev,
      barCrafting: {
        ...prev.barCrafting,
        secondaryResource: {
          name: resource.name,
          materialId: resource._id,
          iconName: resource.iconName || '',
          quantityPerBar: prev.barCrafting.secondaryResource.quantityPerBar || 1
        }
      }
    }));
    setSecondarySearch('');
  };
  
  // Effacer la ressource secondaire
  const clearSecondaryResource = () => {
    setMaterial(prev => ({
      ...prev,
      barCrafting: {
        ...prev.barCrafting,
        secondaryResource: {
          name: '',
          materialId: '',
          iconName: '',
          quantityPerBar: 0
        }
      }
    }));
  };
  
  // Mettre à jour les quantités des ressources
  const updateResourceQuantity = (resourceType, value) => {
    setMaterial(prev => ({
      ...prev,
      barCrafting: {
        ...prev.barCrafting,
        [resourceType]: {
          ...prev.barCrafting[resourceType],
          quantityPerBar: parseInt(value) || 0
        }
      }
    }));
  };

  // État pour les alternatives de craft
  const [craftAlternatives, setCraftAlternatives] = useState([]);
  
  // Ajouter une nouvelle alternative de craft avec un ID unique
  const addCraftAlternative = () => {
    const newAlternative = {
      id: Date.now(), // ID unique pour cette alternative
      name: `Alternative ${craftAlternatives.length + 1}`,
      primaryResource: {
        name: '',
        materialId: '',
        iconName: '',
        quantityPerBar: 1
      },
      secondaryResource: {
        name: '',
        materialId: '',
        iconName: '',
        quantityPerBar: 1
      },
      hasSecondaryResource: false,
      isPreferred: false,
      outputQuantity: material.barCrafting.outputQuantity || 1,
      searchTerm: '', // Pour la recherche de ressource primaire
      secondarySearchTerm: '' // Pour la recherche de ressource secondaire
    };
    
    setCraftAlternatives(prev => [...prev, newAlternative]);
    
    // Basculer automatiquement vers l'onglet de crafting si nous sommes sur l'onglet basic
    if (activeSection === "basic" && material.isBar) {
      setActiveSection("crafting");
    }
    
    // Notification pour l'utilisateur
    toast({
      title: "Alternative ajoutée",
      description: "Vous pouvez maintenant configurer les ressources pour cette alternative."
    });
  };
  
  // Supprimer une alternative de craft
  const removeCraftAlternative = (altId) => {
    setCraftAlternatives(prev => prev.filter(alt => alt.id !== altId));
    
    toast({
      title: "Alternative supprimée"
    });
  };
  
  // Mettre à jour une alternative
  const updateAlternative = (altId, field, value) => {
    setCraftAlternatives(prev => prev.map(alt => {
      if (alt.id !== altId) return alt;
      
      // Pour les champs imbriqués (ex: primaryResource.name)
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...alt,
          [parent]: {
            ...alt[parent],
            [child]: value
          }
        };
      }
      
      // Pour les champs simples
      return {
        ...alt,
        [field]: value
      };
    }));
  };

  // Filter materials for search results
  const getFilteredAlternativeMaterials = (alternative, type) => {
    const searchField = type === 'primaryResource' ? 'searchTerm' : 'secondarySearchTerm';
    const searchTerm = alternative[searchField] || '';
    
    if (!searchTerm || searchTerm.length < 2 || !Array.isArray(allMaterials)) return [];
    
    return allMaterials.filter(material => 
      material.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5); // Limit to 5 results
  };
  
  // Handle selecting a material from search results
  const handleAlternativeMaterialSelect = (altId, resourceType, material) => {
    updateAlternative(altId, resourceType, {
      name: material.name,
      materialId: material._id,
      iconName: material.iconName || '',
      quantityPerBar: 1
    });
    
    // Clear the search term
    const searchField = resourceType === 'primaryResource' ? 'searchTerm' : 'secondarySearchTerm';
    updateAlternative(altId, searchField, '');
  };

  // Adapter le handleSubmit pour inclure les alternatives
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Préparer les données à envoyer
      const materialToSubmit = {
        ...material,
        barCrafting: {
          ...material.barCrafting,
          craftAlternatives: craftAlternatives
        }
      };
      
      console.log("Sending data with alternatives:", materialToSubmit);
      
      const response = await apiPost('/api/materials', materialToSubmit);
      
      toast({
        title: 'Matériau ajouté',
        description: `Le matériau ${material.name} a été ajouté avec succès.`
      });
      
      router.push('/materials');
    } catch (error) {
      console.error("Erreur lors de l'ajout du matériau:", error);
      toast({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de l'ajout du matériau.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tabs for crafting configuration
  const [craftingTab, setCraftingTab] = useState("main");

  return (
    <div className="container mx-auto p-4 bg-white text-black">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Ajouter un Matériau</h1>
          <p className="text-muted-foreground">Créer un nouveau matériau pour le calculateur</p>
        </div>
        <Link href="/materials">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux matériaux
          </Button>
        </Link>
      </div>
      
      <Card className="border bg-white text-black shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b bg-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl text-black">Information sur le matériau</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isBar" 
                  checked={material.isBar}
                  onCheckedChange={toggleIsBar}
                />
                <Label htmlFor="isBar" className="ml-2 text-black">
                  Produit fabriqué
                </Label>
              </div>
            </div>
            {material.isBar && (
              <div className="flex w-full border-t pt-4 mt-4">
                <div className="grid grid-cols-2 w-full gap-2">
                  <Button 
                    type="button" 
                    variant={activeSection === "basic" ? "default" : "outline"}
                    onClick={() => setActiveSection("basic")}
                    className="w-full"
                  >
                    Informations de base
                  </Button>
                  <Button 
                    type="button" 
                    variant={activeSection === "crafting" ? "default" : "outline"}
                    onClick={() => setActiveSection("crafting")}
                    className="w-full"
                  >
                    Configuration de fabrication
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          
          {(!material.isBar || activeSection === "basic") && (
            <CardContent className="pt-6 space-y-4 bg-white text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-black">Nom du matériau <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={material.name}
                    onChange={handleChange}
                    placeholder="Nom du matériau"
                    required
                    className="bg-white text-black border-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="iconName" className="text-black">Nom de l'icône</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="iconName"
                        name="iconName"
                        value={material.iconName}
                        onChange={handleChange}
                        placeholder="ex: inv_misc_herb_01"
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                    {material.iconName && (
                      <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-md">
                        <img 
                          src={`https://wow.zamimg.com/images/wow/icons/medium/${material.iconName.toLowerCase()}.jpg`}
                          alt="Icon preview"
                          className="w-10 h-10 rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: inv_misc_herb_01 (sans extension)
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-black">Catégorie</Label>
                  <Select 
                    value={material.categoryId} 
                    onValueChange={(value) => handleSelectChange('categoryId', value)}
                  >
                    <SelectTrigger className="bg-white text-black border-gray-300">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non catégorisé</SelectItem>
                      {Array.isArray(categories) && categories.map(category => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.icon && <span className="mr-2">{category.icon}</span>}
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-black">Profession principale</Label>
                  <Select 
                    value={material.profession} 
                    onValueChange={(value) => handleSelectChange('profession', value)}
                  >
                    <SelectTrigger className="bg-white text-black border-gray-300">
                      <SelectValue placeholder="Sélectionner une profession" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune profession</SelectItem>
                      {Array.isArray(professions) && professions.map(profession => (
                        <SelectItem key={profession._id} value={profession.name}>
                          {profession.icon && <span className="mr-2">{profession.icon}</span>}
                          {profession.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-black">Quantité par défaut</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={material.quantity}
                    onChange={handleChange}
                    className="bg-white text-black border-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="levelRange" className="text-black">Plage de niveau</Label>
                  <Select 
                    value={material.levelRange} 
                    onValueChange={(value) => handleSelectChange('levelRange', value)}
                  >
                    <SelectTrigger className="bg-white text-black border-gray-300">
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
              
              {/* Ajout d'un bouton pour ajouter des alternatives directement depuis la section basic */}
              {material.isBar && (
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-amber-800">Alternatives de craft</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Ajoutez des méthodes alternatives pour fabriquer ce produit
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCraftAlternative}
                      className="border-amber-400 text-amber-800 hover:bg-amber-100"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une alternative
                    </Button>
                  </div>
                  
                  {craftAlternatives.length > 0 ? (
                    <div className="mt-3">
                      <Text className="text-sm text-amber-700">
                        {craftAlternatives.length} alternative{craftAlternatives.length > 1 ? 's' : ''} configurée{craftAlternatives.length > 1 ? 's' : ''}. 
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-sm text-amber-800 underline"
                          onClick={() => setActiveSection('crafting')}
                        >
                          Aller à la section de configuration
                        </Button>
                      </Text>
                    </div>
                  ) : (
                    <div className="text-sm text-amber-600 mt-2">
                      Aucune alternative ajoutée pour l'instant.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
          
          {material.isBar && activeSection === "crafting" && (
            <CardContent className="pt-6 space-y-6 bg-white text-black">
              {/* Configuration générale de craft - Rendons cela plus visible */}
              <div className="space-y-3 bg-blue-50/50 p-4 rounded-md border border-blue-100">
                <h3 className="text-base font-medium text-black flex items-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-sm mr-2">1</span>
                  Configuration de production
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="outputQuantity" className="text-black flex items-center">
                      Quantité produite par craft
                      <span className="ml-2 text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full">Important</span>
                    </Label>
                    <div className="flex items-center">
                      <Input
                        id="outputQuantity"
                        type="number"
                        min="1"
                        value={material.barCrafting.outputQuantity || 1}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setMaterial(prev => ({
                            ...prev,
                            barCrafting: {
                              ...prev.barCrafting,
                              outputQuantity: value > 0 ? value : 1
                            }
                          }));
                        }}
                        className="bg-white text-black border-gray-300"
                      />
                      <div className="ml-3 text-sm text-blue-700">
                        {material.name ? material.name : "unités"} par craft
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 font-medium">
                      Définissez combien d'unités sont produites à chaque craft (ex: 2 Barres de Bronze par craft).
                      <br/>Cette valeur impacte directement le calcul des ressources nécessaires.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Ressource primaire - Version améliorée */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-md">
                <h3 className="text-base font-medium text-black flex items-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-gray-800 text-sm mr-2">2</span>
                  Ressource Principale
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black">Matériau</Label>
                    <div className="space-y-2" ref={primaryDropdownRef}>
                      <div className="relative">
                        <Input
                          placeholder="Rechercher un matériau..."
                          value={primarySearch}
                          onChange={(e) => setPrimarySearch(e.target.value)}
                          onFocus={() => setPrimarySearchFocused(true)}
                          className="bg-white text-black border-gray-300 pl-10"
                        />
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        
                        <Popover open={primaryFiltersActive} onOpenChange={setPrimaryFiltersActive}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`absolute right-2 top-2 h-6 w-6 ${primaryFiltersActive ? 'bg-primary/20' : ''}`}
                              title="Filtres avancés"
                            >
                              <Filter className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4 bg-white">
                            <div className="space-y-4">
                              <h4 className="font-medium text-sm">Filtres avancés</h4>
                              <div className="space-y-2">
                                <Label htmlFor="primaryCategoryFilter">Catégorie</Label>
                                <Select 
                                  value={primaryFilters.category} 
                                  onValueChange={(value) => setPrimaryFilters(prev => ({...prev, category: value}))}
                                >
                                  <SelectTrigger id="primaryCategoryFilter" className="bg-white text-black">
                                    <SelectValue placeholder="Toutes les catégories" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Toutes les catégories</SelectItem>
                                    {Array.isArray(categories) && categories.map(category => (
                                      <SelectItem key={category._id} value={category._id}>
                                        {category.icon && <span className="mr-2">{category.icon}</span>}
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="primaryProfessionFilter">Profession</Label>
                                <Select 
                                  value={primaryFilters.profession} 
                                  onValueChange={(value) => setPrimaryFilters(prev => ({...prev, profession: value}))}
                                >
                                  <SelectTrigger id="primaryProfessionFilter" className="bg-white text-black">
                                    <SelectValue placeholder="Toutes les professions" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Toutes les professions</SelectItem>
                                    {Array.isArray(professions) && professions.map(profession => (
                                      <SelectItem key={profession._id} value={profession.name}>
                                        {profession.icon && <span className="mr-2">{profession.icon}</span>}
                                        {profession.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex justify-end gap-2 pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setPrimaryFilters({ category: '', profession: '' });
                                  }}
                                >
                                  Réinitialiser
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => setPrimaryFiltersActive(false)}
                                >
                                  Appliquer
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      {(primarySearchFocused || primarySearch.length > 0) && (
                        <div className="absolute z-50 w-full mt-1 border bg-white rounded-md shadow-md max-h-[300px] overflow-y-auto">
                          {filteredPrimaryMaterials.length > 0 ? (
                            filteredPrimaryMaterials.map((mat) => (
                              <div 
                                key={mat._id} 
                                className="flex items-center p-3 hover:bg-accent cursor-pointer border-b"
                                onClick={() => {
                                  selectPrimaryResource(mat);
                                  setPrimarySearchFocused(false);
                                  setPrimarySearch(''); // Effacer la recherche après sélection
                                }}
                              >
                                <div className="flex-shrink-0 mr-3">
                                  {mat.iconName && (
                                    <img
                                      src={`https://wow.zamimg.com/images/wow/icons/small/${mat.iconName.toLowerCase()}.jpg`}
                                      alt={mat.name}
                                      className="w-8 h-8 rounded"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <div className="text-black font-medium">
                                    {highlightMatch(mat.name, primarySearch)}
                                  </div>
                                  <div className="flex gap-2 mt-1 text-xs">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      {getCategoryName(mat.categoryId)}
                                    </Badge>
                                    {mat.profession && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {mat.profession}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {mat.isBar && (
                                  <Badge className="ml-2 bg-amber-100 text-amber-800">Craftable</Badge>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="border bg-white text-gray-500 p-3 rounded-md text-center">
                              {allMaterials.length === 0 ? "Chargement des ressources..." : "Aucun matériau trouvé"}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {material.barCrafting.primaryResource.materialId && (
                        <div className="flex items-center mt-2 p-2 bg-accent/30 rounded-md">
                          {material.barCrafting.primaryResource.iconName && (
                            <img
                              src={`https://wow.zamimg.com/images/wow/icons/small/${material.barCrafting.primaryResource.iconName.toLowerCase()}.jpg`}
                              alt={material.barCrafting.primaryResource.name}
                              className="w-6 h-6 mr-2 rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                              }}
                            />
                          )}
                          <span className="flex-grow text-black">{material.barCrafting.primaryResource.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearPrimaryResource}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryResourceIcon" className="text-black">Icône (optionnel)</Label>
                    <Input
                      id="primaryResourceIcon"
                      value={material.barCrafting.primaryResource.iconName || ''}
                      onChange={(e) => {
                        const { value } = e.target;
                        setMaterial(prev => ({
                          ...prev,
                          barCrafting: {
                            ...prev.barCrafting,
                            primaryResource: {
                              ...prev.barCrafting.primaryResource,
                              iconName: value
                            }
                          }
                        }));
                      }}
                      placeholder="inv_ore_copper_01"
                      className="bg-white text-black border-gray-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryResourceQty" className="text-black">Quantité par unité</Label>
                    <Input
                      id="primaryResourceQty"
                      type="number"
                      min="1"
                      value={material.barCrafting.primaryResource.quantityPerBar || ''}
                      onChange={(e) => updateResourceQuantity('primaryResource', e.target.value)}
                      placeholder="Ex: 2"
                      className="bg-white text-black border-gray-300"
                    />
                  </div>
                </div>
              </div>
              
              {/* Toggle ressource secondaire */}
              <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-md">
                <Switch
                  id="hasSecondaryResource"
                  checked={material.barCrafting.hasSecondaryResource}
                  onCheckedChange={toggleSecondaryResource}
                />
                <Label htmlFor="hasSecondaryResource" className="text-black">
                  Nécessite une ressource secondaire
                </Label>
              </div>
              
              {/* Ressource secondaire - Version améliorée - conditionnellement affichée */}
              {material.barCrafting.hasSecondaryResource && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-md border-l-4 border-primary/30">
                  <h3 className="text-base font-medium text-black flex items-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-gray-800 text-sm mr-2">3</span>
                    Ressource Secondaire
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-black">Matériau</Label>
                      <div className="space-y-2" ref={secondaryDropdownRef}>
                        <div className="relative">
                          <Input
                            placeholder="Rechercher un matériau..."
                            value={secondarySearch}
                            onChange={(e) => setSecondarySearch(e.target.value)}
                            onFocus={() => setSecondarySearchFocused(true)}
                            className="bg-white text-black border-gray-300 pl-10"
                          />
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          
                          <Popover open={secondaryFiltersActive} onOpenChange={setSecondaryFiltersActive}>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`absolute right-2 top-2 h-6 w-6 ${secondaryFiltersActive ? 'bg-primary/20' : ''}`}
                                title="Filtres avancés"
                              >
                                <Filter className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 bg-white">
                              <div className="space-y-4">
                                <h4 className="font-medium text-sm">Filtres avancés</h4>
                                <div className="space-y-2">
                                  <Label htmlFor="secondaryCategoryFilter">Catégorie</Label>
                                  <Select 
                                    value={secondaryFilters.category} 
                                    onValueChange={(value) => setSecondaryFilters(prev => ({...prev, category: value}))}
                                  >
                                    <SelectTrigger id="secondaryCategoryFilter" className="bg-white text-black">
                                      <SelectValue placeholder="Toutes les catégories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">Toutes les catégories</SelectItem>
                                      {Array.isArray(categories) && categories.map(category => (
                                        <SelectItem key={category._id} value={category._id}>
                                          {category.icon && <span className="mr-2">{category.icon}</span>}
                                          {category.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="secondaryProfessionFilter">Profession</Label>
                                  <Select 
                                    value={secondaryFilters.profession} 
                                    onValueChange={(value) => setSecondaryFilters(prev => ({...prev, profession: value}))}
                                  >
                                    <SelectTrigger id="secondaryProfessionFilter" className="bg-white text-black">
                                      <SelectValue placeholder="Toutes les professions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">Toutes les professions</SelectItem>
                                      {Array.isArray(professions) && professions.map(profession => (
                                        <SelectItem key={profession._id} value={profession.name}>
                                          {profession.icon && <span className="mr-2">{profession.icon}</span>}
                                          {profession.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="flex justify-end gap-2 pt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      setSecondaryFilters({ category: '', profession: '' });
                                    }}
                                  >
                                    Réinitialiser
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={() => setSecondaryFiltersActive(false)}
                                  >
                                    Appliquer
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {(secondarySearchFocused || secondarySearch.length > 0) && (
                          <div className="absolute z-50 w-full mt-1 border bg-white rounded-md shadow-md max-h-[300px] overflow-y-auto">
                            {filteredSecondaryMaterials.length > 0 ? (
                              filteredSecondaryMaterials.map((mat) => (
                                <div 
                                  key={mat._id} 
                                  className="flex items-center p-3 hover:bg-accent cursor-pointer border-b"
                                  onClick={() => {
                                    selectSecondaryResource(mat);
                                    setSecondarySearchFocused(false);
                                    setSecondarySearch(''); // Effacer la recherche après sélection
                                  }}
                                >
                                  <div className="flex-shrink-0 mr-3">
                                    {mat.iconName && (
                                      <img
                                        src={`https://wow.zamimg.com/images/wow/icons/small/${mat.iconName.toLowerCase()}.jpg`}
                                        alt={mat.name}
                                        className="w-8 h-8 rounded"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                        }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex-grow">
                                    <div className="text-black font-medium">
                                      {highlightMatch(mat.name, secondarySearch)}
                                    </div>
                                    <div className="flex gap-2 mt-1 text-xs">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                        {getCategoryName(mat.categoryId)}
                                      </Badge>
                                      {mat.profession && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700">
                                          {mat.profession}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {mat.isBar && (
                                    <Badge className="ml-2 bg-amber-100 text-amber-800">Craftable</Badge>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="border bg-white text-gray-500 p-3 rounded-md text-center">
                                {allMaterials.length === 0 ? "Chargement des ressources..." : "Aucun matériau trouvé"}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {material.barCrafting.secondaryResource.materialId && (
                          <div className="flex items-center mt-2 p-2 bg-accent/30 rounded-md">
                            {material.barCrafting.secondaryResource.iconName && (
                              <img
                                src={`https://wow.zamimg.com/images/wow/icons/small/${material.barCrafting.secondaryResource.iconName.toLowerCase()}.jpg`}
                                alt={material.barCrafting.secondaryResource.name}
                                className="w-6 h-6 mr-2 rounded"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                }}
                              />
                            )}
                            <span className="flex-grow text-black">{material.barCrafting.secondaryResource.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearSecondaryResource}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryResourceIcon" className="text-black">Icône (optionnel)</Label>
                      <Input
                        id="secondaryResourceIcon"
                        value={material.barCrafting.secondaryResource.iconName || ''}
                        onChange={(e) => {
                          const { value } = e.target;
                          setMaterial(prev => ({
                            ...prev,
                            barCrafting: {
                              ...prev.barCrafting,
                              secondaryResource: {
                                ...prev.barCrafting.secondaryResource,
                                iconName: value
                              }
                            }
                          }));
                        }}
                        placeholder="inv_ore_tin_01"
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryResourceQty" className="text-black">Quantité par unité</Label>
                      <Input
                        id="secondaryResourceQty"
                        type="number"
                        min="1"
                        value={material.barCrafting.secondaryResource.quantityPerBar || ''}
                        onChange={(e) => updateResourceQuantity('secondaryResource', e.target.value)}
                        placeholder="Ex: 1"
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Section pour les alternatives de craft */}
              <div className="space-y-3 bg-amber-50/50 p-4 rounded-md border border-amber-100 mt-6">
                <h3 className="text-base font-medium text-black flex items-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-800 text-sm mr-2">+</span>
                  Alternatives de craft (optionnelles)
                </h3>
                
                <p className="text-sm text-amber-800">
                  Vous pouvez définir des options de craft alternatives pour cette ressource.
                  Par exemple, si le matériau peut être crafté avec différentes ressources.
                </p>
                
                {craftAlternatives.length > 0 && (
                  <div className="space-y-6 mt-4 divide-y divide-amber-200">
                    {craftAlternatives.map((alternative, index) => (
                      <div key={index} className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Alternative #{index + 1}</h4>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeCraftAlternative(index)}
                            className="h-8 text-destructive hover:text-destructive"
                          >
                            Supprimer
                          </Button>
                        </div>
                        
                        {/* Composant similaire à la section de ressource principale */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3 rounded-md border border-gray-200">
                          {/* Même structure que pour la ressource principale et secondaire, mais pour l'alternative */}
                          <div className="space-y-2">
                            <Label className="text-black">Ressource principale</Label>
                            <div className="space-y-2 relative">
                              {/* Search input */}
                              <div className="relative">
                                <Input
                                  placeholder="Rechercher un matériau..."
                                  className="bg-white text-black border-gray-300 pl-10"
                                  value={alternative.searchTerm || ''}
                                  onChange={(e) => updateCraftAlternative(alternative.id, 'searchTerm', e.target.value)}
                                />
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                              </div>
                              
                              {/* Search results dropdown */}
                              {alternative.searchTerm && alternative.searchTerm.length >= 2 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                                  {getFilteredAlternativeMaterials(alternative, 'primaryResource').map((material) => (
                                    <div
                                      key={material._id}
                                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                      onClick={() => handleAlternativeMaterialSelect(alternative.id, 'primaryResource', material)}
                                    >
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
                                  ))}
                                </div>
                              )}
                              
                              {/* ...existing selected resource display... */}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`altPrimaryIcon-${index}`} className="text-black">Icône</Label>
                            <Input 
                              id={`altPrimaryIcon-${index}`}
                              value={alternative.primaryResource.iconName}
                              onChange={(e) => updateCraftAlternative(index, 'primaryResource.iconName', e.target.value)}
                              placeholder="inv_ore_copper_01"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`altPrimaryQty-${index}`} className="text-black">Quantité</Label>
                            <Input 
                              id={`altPrimaryQty-${index}`}
                              type="number"
                              min="1"
                              value={alternative.primaryResource.quantityPerBar}
                              onChange={(e) => updateCraftAlternative(index, 'primaryResource.quantityPerBar', parseInt(e.target.value) || 1)}
                              placeholder="1"
                            />
                          </div>
                        </div>
                        
                        {/* Option pour activer ressource secondaire */}
                        <div className="flex items-center space-x-2 mt-3 mb-2">
                          <Switch 
                            checked={alternative.hasSecondaryResource}
                            onCheckedChange={(checked) => updateCraftAlternative(index, 'hasSecondaryResource', checked)}
                          />
                          <Label className="text-black">Ajouter une ressource secondaire</Label>
                        </div>
                        
                        {alternative.hasSecondaryResource && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3 rounded-md border border-gray-200">
                            <div className="space-y-2">
                              <Label className="text-black">Ressource secondaire</Label>
                              <div className="space-y-2 relative">
                                {/* Search input */}
                                <div className="relative">
                                  <Input
                                    placeholder="Rechercher un matériau..."
                                    className="bg-white text-black border-gray-300 pl-10"
                                    value={alternative.secondarySearchTerm || ''}
                                    onChange={(e) => updateCraftAlternative(alternative.id, 'secondarySearchTerm', e.target.value)}
                                  />
                                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                </div>
                                
                                {/* Search results dropdown */}
                                {alternative.secondarySearchTerm && alternative.secondarySearchTerm.length >= 2 && (
                                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                                    {getFilteredAlternativeMaterials(alternative, 'secondaryResource').map((material) => (
                                      <div
                                        key={material._id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                        onClick={() => handleAlternativeMaterialSelect(alternative.id, 'secondaryResource', material)}
                                      >
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
                                    ))}
                                  </div>
                                )}
                                
                                {/* ...existing selected resource display... */}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`altSecondaryIcon-${index}`} className="text-black">Icône</Label>
                              <Input 
                                id={`altSecondaryIcon-${index}`}
                                value={alternative.secondaryResource.iconName}
                                onChange={(e) => updateCraftAlternative(index, 'secondaryResource.iconName', e.target.value)}
                                placeholder="inv_ore_tin_01"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`altSecondaryQty-${index}`} className="text-black">Quantité</Label>
                              <Input 
                                id={`altSecondaryQty-${index}`}
                                type="number"
                                min="1"
                                value={alternative.secondaryResource.quantityPerBar}
                                onChange={(e) => updateCraftAlternative(index, 'secondaryResource.quantityPerBar', parseInt(e.target.value) || 1)}
                                placeholder="1"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Option pour marquer cette alternative comme préférée */}
                        <div className="flex items-center space-x-2 mt-4 bg-amber-50 p-2 rounded">
                          <Switch 
                            checked={alternative.isPreferred}
                            onCheckedChange={(checked) => updateCraftAlternative(index, 'isPreferred', checked)}
                          />
                          <Label className="text-amber-900">Marquer comme alternative préférée</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCraftAlternative}
                  className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une alternative de craft
                </Button>
              </div>
              
              {/* Aperçu - version simplifiée et légère */}
              <div className="p-4 bg-white border rounded-md">
                <h4 className="text-sm font-medium mb-4 text-black">Aperçu de la Fabrication</h4>
                <div className="flex flex-wrap items-center justify-center gap-4 bg-gray-50 p-4 rounded-md">
                  <div className="text-center">
                    <div className="bg-accent/20 p-2 rounded-md inline-block mb-2">
                      {material.barCrafting.primaryResource.iconName ? (
                        <img 
                          src={`https://wow.zamimg.com/images/wow/icons/medium/${material.barCrafting.primaryResource.iconName.toLowerCase()}.jpg`}
                          alt="Primary resource"
                          className="w-10 h-10 rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg';
                          }}
                        />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="font-bold">{material.barCrafting.primaryResource.quantityPerBar || '?'}</div>
                    <div className="text-xs text-black">{material.barCrafting.primaryResource.name || 'Ressource'}</div>
                  </div>
                  
                  {material.barCrafting.hasSecondaryResource && (
                    <>
                      <div className="flex items-center justify-center">
                        <Plus className="h-6 w-6 text-black" />
                      </div>
                      
                      <div className="text-center">
                        <div className="bg-accent/20 p-2 rounded-md inline-block mb-2">
                          {material.barCrafting.secondaryResource.iconName ? (
                            <img 
                              src={`https://wow.zamimg.com/images/wow/icons/medium/${material.barCrafting.secondaryResource.iconName.toLowerCase()}.jpg`}
                              alt="Secondary resource"
                              className="w-10 h-10 rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg';
                              }}
                            />
                          ) : (
                            <Package className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                        <div className="font-bold">{material.barCrafting.secondaryResource.quantityPerBar || '?'}</div>
                        <div className="text-xs text-black">{material.barCrafting.secondaryResource.name || 'Ressource'}</div>
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-black" />
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-primary/10 p-2 rounded-md inline-block mb-2">
                      {material.iconName ? (
                        <img 
                          src={`https://wow.zamimg.com/images/wow/icons/medium/${material.iconName.toLowerCase()}.jpg`}
                          alt="Output item"
                          className="w-12 h-12 rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg';
                          }}
                        />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="font-bold flex items-center justify-center">
                      <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-sm">
                        {material.barCrafting.outputQuantity || 1}×
                      </span>
                    </div>
                    <div className="text-xs text-black">{material.name || 'Produit'}</div>
                  </div>
                </div>
                
                {/* Explication supplémentaire du ratio */}
                <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800 border border-blue-100">
                  <p className="font-medium">Ratio de production:</p>
                  {material.barCrafting.primaryResource.name && (
                    <p>
                      {material.barCrafting.primaryResource.quantityPerBar || 1}× {material.barCrafting.primaryResource.name}
                      {material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource.name && (
                        <> + {material.barCrafting.secondaryResource.quantityPerBar || 1}× {material.barCrafting.secondaryResource.name}</>
                      )}
                      {" → "}
                      <strong>{material.barCrafting.outputQuantity || 1}× {material.name || "produit"}</strong>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          )}
          
          <CardFooter className="border-t p-4 bg-white">
            <Button type="submit" disabled={isSubmitting} className="ml-auto">
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter le matériau'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
  
  // Fonction utilitaire pour mettre en surbrillance les correspondances
  function highlightMatch(text, query) {
    if (!query || !text) return text;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    
    if (lowerQuery.length === 0 || !lowerText.includes(lowerQuery)) return text;
    
    const startIndex = lowerText.indexOf(lowerQuery);
    const endIndex = startIndex + lowerQuery.length;
    
    return (
      <>
        {startIndex > 0 ? text.substring(0, startIndex) : ''}
        <span className="bg-yellow-100 text-black font-semibold">
          {text.substring(startIndex, endIndex)}
        </span>
        {endIndex < text.length ? text.substring(endIndex) : ''}
        </>
    )
  }
}
