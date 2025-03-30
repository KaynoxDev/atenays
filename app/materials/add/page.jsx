'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { apiPost, useGet } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Info, Plus, RefreshCw, Save, Search, Trash2, X, Copy, CopyPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

// Fonction pour forcer un thème spécifique
const forceTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
};

export default function AddMaterialPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("basic"); // "basic" ou "crafting"
  
  // Nouvel état pour le mode multi-ajout
  const [multiAddMode, setMultiAddMode] = useState(false);
  // Liste des matériaux dans le mode multi-ajout
  const [materialsList, setMaterialsList] = useState([]);
  // Index du matériau actuellement sélectionné dans la liste
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  
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
  
  // Activer le mode multi-ajout
  const enableMultiAddMode = () => {
    // Si le matériau actuel a des données, l'ajouter comme premier élément
    if (material.name) {
      setMaterialsList([{...material}]);
    } else {
      setMaterialsList([{...getEmptyMaterial()}]);
    }
    setMultiAddMode(true);
  };
  
  // Désactiver le mode multi-ajout
  const disableMultiAddMode = () => {
    // Si la liste contient des matériaux, utiliser le premier comme matériau actuel
    if (materialsList.length > 0) {
      setMaterial({...materialsList[0]});
    }
    setMultiAddMode(false);
    setSelectedMaterialIndex(0);
  };
  
  // Obtenir un objet matériau vide
  const getEmptyMaterial = () => {
    return {
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
        outputQuantity: 1,
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
        craftAlternatives: []
      }
    };
  };
  
  // Ajouter un nouveau matériau à la liste
  const addNewMaterial = () => {
    setMaterialsList(prev => [...prev, getEmptyMaterial()]);
    setSelectedMaterialIndex(materialsList.length);
  };
  
  // Dupliquer un matériau existant
  const duplicateMaterial = (index) => {
    const materialToDuplicate = {...materialsList[index]};
    materialToDuplicate.name = `${materialToDuplicate.name} (copie)`;
    setMaterialsList(prev => [...prev.slice(0, index + 1), materialToDuplicate, ...prev.slice(index + 1)]);
    setSelectedMaterialIndex(index + 1);
  };
  
  // Supprimer un matériau de la liste
  const removeMaterial = (index) => {
    if (materialsList.length <= 1) {
      toast({
        title: "Impossible de supprimer",
        description: "Vous devez avoir au moins un matériau dans la liste."
      });
      return;
    }
    
    const newList = materialsList.filter((_, i) => i !== index);
    setMaterialsList(newList);
    
    // Ajuster l'index sélectionné si nécessaire
    if (selectedMaterialIndex >= newList.length) {
      setSelectedMaterialIndex(newList.length - 1);
    } else if (selectedMaterialIndex === index) {
      // Si on supprime l'élément sélectionné, sélectionner le suivant ou le précédent
      setSelectedMaterialIndex(Math.max(0, selectedMaterialIndex - 1));
    }
  };
  
  // Sélectionner un matériau dans la liste
  const selectMaterial = (index) => {
    setSelectedMaterialIndex(index);
  };
  
  // Pour les champs simples - KEEP THIS VERSION AND REMOVE THE DUPLICATE
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (multiAddMode) {
      // Mettre à jour le matériau dans la liste
      setMaterialsList(prev => {
        const newList = [...prev];
        newList[selectedMaterialIndex] = {
          ...newList[selectedMaterialIndex],
          [name]: value
        };
        return newList;
      });
    } else {
      // Mettre à jour le matériau unique
      setMaterial(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSelectChange = (name, value) => {
    if (multiAddMode) {
      setMaterialsList(prev => {
        const newList = [...prev];
        newList[selectedMaterialIndex] = {
          ...newList[selectedMaterialIndex],
          [name]: value
        };
        return newList;
      });
    } else {
      setMaterial(prev => {
        const updated = { ...prev, [name]: value };
        
        // Mise à jour supplémentaire pour la profession
        if (name === 'profession' && value) {
          updated.professions = [...new Set([...prev.professions, value])];
          updated.requiredBy = [...new Set([...prev.requiredBy, value])];
        }
        
        return updated;
      });
    }
  };
  
  // Activer/désactiver la fabrication
  const toggleIsBar = (checked) => {
    if (multiAddMode) {
      setMaterialsList(prev => {
        const newList = [...prev];
        newList[selectedMaterialIndex] = {
          ...newList[selectedMaterialIndex],
          isBar: checked
        };
        return newList;
      });
    } else {
      setMaterial(prev => ({
        ...prev,
        isBar: checked
      }));
    }
  };
  
  // Activer/désactiver la ressource secondaire
  const toggleSecondaryResource = (checked) => {
    if (multiAddMode) {
      setMaterialsList(prev => {
        const newList = [...prev];
        newList[selectedMaterialIndex] = {
          ...newList[selectedMaterialIndex],
          barCrafting: {
            ...newList[selectedMaterialIndex].barCrafting,
            hasSecondaryResource: checked
          }
        };
        return newList;
      });
    } else {
      setMaterial(prev => ({
        ...prev,
        barCrafting: {
          ...prev.barCrafting,
          hasSecondaryResource: checked
        }
      }));
    }
  };
  
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
        // Ensure m is not null before accessing properties
        if (!m) return false;
        
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
            (Array.isArray(m.professions) && m.professions.includes(primaryFilters.profession)));
          
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
    const category = categories.find(c => c?._id === categoryId);
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

  // Améliorer la fonction handleSubmit pour vraiment soumettre tous les matériaux en mode multi-ajout
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (multiAddMode) {
        // Vérifier que tous les matériaux ont un nom
        const invalidMaterials = materialsList.filter(mat => !mat.name.trim());
        if (invalidMaterials.length > 0) {
          toast({
            title: "Données incomplètes",
            description: `${invalidMaterials.length} matériau(x) n'ont pas de nom défini.`,
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        // Soumettre tous les matériaux un par un avec gestion des erreurs
        const results = [];
        const errors = [];
        
        for (let i = 0; i < materialsList.length; i++) {
          const mat = materialsList[i];
          try {
            // Préparer les données pour ce matériau specifique
            const materialToSubmit = {
              ...mat,
              barCrafting: mat.isBar ? {
                ...mat.barCrafting,
                craftAlternatives: mat.barCrafting?.craftAlternatives || []
              } : undefined
            };
            
            console.log(`Submitting material ${i+1}/${materialsList.length}: ${mat.name}`);
            const result = await apiPost('/api/materials', materialToSubmit);
            results.push(result);
          } catch (error) {
            console.error(`Erreur lors de l'ajout du matériau ${mat.name}:`, error);
            errors.push({ name: mat.name, error: error.message });
          }
        }
        
        // Afficher un message de succès global
        if (results.length > 0) {
          toast({
            title: "Matériaux ajoutés",
            description: `${results.length} matériau(x) ont été ajoutés avec succès sur ${materialsList.length}.`
          });
          
          // Afficher les erreurs si certains matériaux n'ont pas pu être ajoutés
          if (errors.length > 0) {
            toast({
              title: `${errors.length} erreur(s) rencontrée(s)`,
              description: "Certains matériaux n'ont pas pu être ajoutés.",
              variant: "destructive"
            });
          }
          
          // Rediriger vers la page des matériaux
          router.push('/materials');
        }
      } else {
        // Logique d'ajout pour un seul matériau (inchangée)
        if (!material.name.trim()) {
          toast({
            title: "Erreur",
            description: "Le nom du matériau est requis",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        // Préparer les données à envoyer
        const materialToSubmit = {
          ...material,
          barCrafting: {
            ...material.barCrafting,
            craftAlternatives: craftAlternatives
          }
        };
        
        const response = await apiPost('/api/materials', materialToSubmit);
        
        toast({
          title: 'Matériau ajouté',
          description: `Le matériau ${material.name} a été ajouté avec succès.`
        });
        
        router.push('/materials');
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du/des matériau(x):", error);
      toast({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de l'ajout.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Améliorer la gestion du formulaire pour le matériau actuellement sélectionné
  const [currentMaterialAlternatives, setCurrentMaterialAlternatives] = useState([]);
  
  // Mettre à jour les alternatives pour le matériau actuellement sélectionné
  useEffect(() => {
    if (multiAddMode) {
      // En mode multi-ajout, chaque matériau a ses propres alternatives
      const currentMaterial = materialsList[selectedMaterialIndex];
      if (currentMaterial && currentMaterial.barCrafting) {
        setCurrentMaterialAlternatives(currentMaterial.barCrafting.craftAlternatives || []);
      } else {
        setCurrentMaterialAlternatives([]);
      }
    } else {
      // En mode standard, utiliser les alternatives globales
      setCurrentMaterialAlternatives(craftAlternatives);
    }
  }, [multiAddMode, selectedMaterialIndex, materialsList, craftAlternatives]);
  
  // Fonction pour ajouter une alternative au matériau actuellement sélectionné
  const addAlternativeToCurrent = () => {
    const newAlternative = {
      id: Date.now(),
      name: `Alternative ${currentMaterialAlternatives.length + 1}`,
      primaryResource: { name: '', materialId: '', iconName: '', quantityPerBar: 1 },
      secondaryResource: { name: '', materialId: '', iconName: '', quantityPerBar: 1 },
      hasSecondaryResource: false,
      isPreferred: false,
      outputQuantity: currentMaterial.barCrafting?.outputQuantity || 1,
      searchTerm: '',
      secondarySearchTerm: ''
    };
    
    if (multiAddMode) {
      // En mode multi-ajout, mettre à jour le matériau spécifique
      setMaterialsList(prev => {
        const newList = [...prev];
        if (!newList[selectedMaterialIndex].barCrafting.craftAlternatives) {
          newList[selectedMaterialIndex].barCrafting.craftAlternatives = [];
        }
        newList[selectedMaterialIndex].barCrafting.craftAlternatives.push(newAlternative);
        return newList;
      });
      setCurrentMaterialAlternatives(prev => [...prev, newAlternative]);
    } else {
      // En mode standard, utiliser la fonction existante
      setCraftAlternatives(prev => [...prev, newAlternative]);
    }
    
    toast({
      title: "Alternative ajoutée",
      description: "Vous pouvez maintenant configurer cette alternative."
    });
  };
  
  // Fonction pour mettre à jour une alternative du matériau actuellement sélectionné
  const updateCurrentAlternative = (altId, field, value) => {
    if (multiAddMode) {
      // En mode multi-ajout, mettre à jour le matériau spécifique
      setMaterialsList(prev => {
        const newList = [...prev];
        const alternatives = newList[selectedMaterialIndex].barCrafting.craftAlternatives || [];
        const updatedAlternatives = alternatives.map(alt => {
          if (alt.id !== altId) return alt;
          
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
          
          return { ...alt, [field]: value };
        });
        
        newList[selectedMaterialIndex].barCrafting.craftAlternatives = updatedAlternatives;
        return newList;
      });
      
      // Mettre également à jour l'état local des alternatives pour le rendu
      setCurrentMaterialAlternatives(prev => prev.map(alt => {
        if (alt.id !== altId) return alt;
        
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
        
        return { ...alt, [field]: value };
      }));
    } else {
      // En mode standard, utiliser la fonction existante
      updateAlternative(altId, field, value);
    }
  };
  
  // Fonction pour supprimer une alternative du matériau actuellement sélectionné
  const removeCurrentAlternative = (altId) => {
    if (multiAddMode) {
      // En mode multi-ajout, mettre à jour le matériau spécifique
      setMaterialsList(prev => {
        const newList = [...prev];
        const alternatives = newList[selectedMaterialIndex].barCrafting.craftAlternatives || [];
        newList[selectedMaterialIndex].barCrafting.craftAlternatives = alternatives.filter(alt => alt.id !== altId);
        return newList;
      });
      
      // Mettre également à jour l'état local des alternatives pour le rendu
      setCurrentMaterialAlternatives(prev => prev.filter(alt => alt.id !== altId));
    } else {
      // En mode standard, utiliser la fonction existante
      removeCraftAlternative(altId);
    }
    
    toast({
      title: "Alternative supprimée"
    });
  };
  
  // Obtenir le matériau actuellement sélectionné
  const currentMaterial = multiAddMode ? materialsList[selectedMaterialIndex] || getEmptyMaterial() : material;

  return (
    <div className="container mx-auto p-4 bg-white text-black">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Ajouter un matériau</h1>
          <p className="text-muted-foreground">
            {multiAddMode 
              ? `Mode multi-ajout (${materialsList.length} matériaux)` 
              : "Créer un nouveau matériau dans la base de données"}
          </p>
        </div>
        <div className="flex gap-2">
          {!multiAddMode && (
            <Button variant="outline" onClick={enableMultiAddMode}>
              <CopyPlus className="h-4 w-4 mr-2" />
              Mode multi-ajout
            </Button>
          )}
          {multiAddMode && (
            <Button variant="outline" onClick={disableMultiAddMode}>
              <X className="h-4 w-4 mr-2" />
              Quitter le multi-ajout
            </Button>
          )}
          <Link href="/materials">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux matériaux
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Interface pour le mode multi-ajout - Structure corrigée et complète */}
      {multiAddMode && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          {/* Sidebar pour la liste des matériaux */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Liste des matériaux</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={addNewMaterial}
                  title="Ajouter un nouveau matériau"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[50vh]">
                <div className="px-1">
                  {materialsList.map((mat, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 mb-1 rounded cursor-pointer ${
                        index === selectedMaterialIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                      onClick={() => selectMaterial(index)}
                    >
                      <div className="flex items-center overflow-hidden">
                        {mat.iconName && (
                          <img
                            src={`https://wow.zamimg.com/images/wow/icons/small/${mat.iconName.toLowerCase()}.jpg`}
                            alt={mat.name}
                            className="w-6 h-6 mr-2 rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                            }}
                          />
                        )}
                        <span className="font-medium truncate">
                          {mat.name || `Nouveau matériau ${index + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {mat.isBar && (
                          <Badge variant="outline" className="mr-2 text-xs">
                            Craftable
                          </Badge>
                        )}
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateMaterial(index);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMaterial(index);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-center p-3 border-t">
              <Button variant="outline" onClick={addNewMaterial} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un matériau
              </Button>
            </CardFooter>
          </Card>
          
          {/* Formulaire d'édition du matériau sélectionné */}
          <div className="md:col-span-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  {currentMaterial?.name 
                    ? `Édition de ${currentMaterial.name}`
                    : `Nouveau matériau ${selectedMaterialIndex + 1}`
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Champs pour le matériau courant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du matériau *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={currentMaterial?.name || ''}
                        onChange={handleChange}
                        placeholder="Ex: Minerai de cuivre"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="iconName">Nom de l'icône</Label>
                      <Input
                        id="iconName"
                        name="iconName"
                        value={currentMaterial?.iconName || ''}
                        onChange={handleChange}
                        placeholder="Ex: inv_ore_copper_01"
                      />
                      {currentMaterial?.iconName && (
                        <div className="mt-2">
                          <img
                            src={`https://wow.zamimg.com/images/wow/icons/medium/${currentMaterial.iconName.toLowerCase()}.jpg`}
                            alt="Aperçu de l'icône"
                            className="w-12 h-12 rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Catégorie</Label>
                      <Select
                        value={currentMaterial?.categoryId || "none"}
                        onValueChange={(value) => handleSelectChange('categoryId', value === "none" ? "" : value)}
                      >
                        <SelectTrigger id="categoryId">
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Non catégorisé</SelectItem>
                          {Array.isArray(categories) && categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession principale</Label>
                      <Select
                        value={currentMaterial?.profession || "none"}
                        onValueChange={(value) => handleSelectChange('profession', value === "none" ? "" : value)}
                      >
                        <SelectTrigger id="profession">
                          <SelectValue placeholder="Sélectionner une profession" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune profession</SelectItem>
                          {Array.isArray(professions) && professions.map((prof) => (
                            <SelectItem key={prof._id} value={prof.name}>
                              {prof.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="levelRange">Niveau de compétence requis</Label>
                      <Select
                        value={currentMaterial?.levelRange || "525"}
                        onValueChange={(value) => handleSelectChange('levelRange', value)}
                      >
                        <SelectTrigger id="levelRange">
                          <SelectValue placeholder="Niveau requis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="75">1-75 (Apprenti)</SelectItem>
                          <SelectItem value="150">1-150 (Compagnon)</SelectItem>
                          <SelectItem value="225">1-225 (Expert)</SelectItem>
                          <SelectItem value="300">1-300 (Artisan)</SelectItem>
                          <SelectItem value="375">1-375 (Maître)</SelectItem>
                          <SelectItem value="450">1-450 (Grand maître)</SelectItem>
                          <SelectItem value="525">1-525 (Illustre)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isBar"
                        checked={currentMaterial?.isBar || false}
                        onCheckedChange={toggleIsBar}
                      />
                      <Label htmlFor="isBar">
                        Ce matériau peut être fabriqué (craftable)
                      </Label>
                    </div>
                  </div>
                </div>
                
                {/* Configuration de craft si le matériau est craftable */}
                {currentMaterial?.isBar && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-lg mb-4">Configuration du craft</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <Label htmlFor="outputQuantity">Quantité produite par craft</Label>
                        <Input
                          id="outputQuantity"
                          type="number"
                          value={currentMaterial?.barCrafting?.outputQuantity || 1}
                          onChange={(e) => {
                            if (multiAddMode) {
                              setMaterialsList(prev => {
                                const newList = [...prev];
                                if (!newList[selectedMaterialIndex].barCrafting) {
                                  newList[selectedMaterialIndex].barCrafting = {};
                                }
                                newList[selectedMaterialIndex].barCrafting = {
                                  ...newList[selectedMaterialIndex].barCrafting,
                                  outputQuantity: parseInt(e.target.value) || 1
                                };
                                return newList;
                              });
                            } else {
                              setMaterial(prev => ({
                                ...prev,
                                barCrafting: {
                                  ...prev.barCrafting,
                                  outputQuantity: parseInt(e.target.value) || 1
                                }
                              }));
                            }
                          }}
                          min="1"
                          placeholder="1"
                        />
                      </div>
                    </div>
                    
                    {/* Section alternatives de craft */}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Alternatives de craft</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addAlternativeToCurrent}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une alternative
                        </Button>
                      </div>
                      
                      {currentMaterialAlternatives.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-4 bg-gray-50 rounded-md border">
                          Aucune alternative configurée pour ce matériau.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {currentMaterialAlternatives.map((alt) => (
                            <div key={alt.id} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                  <Input
                                    value={alt.name || ''}
                                    onChange={(e) => updateCurrentAlternative(alt.id, 'name', e.target.value)}
                                    placeholder="Nom de l'alternative"
                                    className="w-64"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCurrentAlternative(alt.id)}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Mode normal (non multi-ajout) */}
      {!multiAddMode && (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Informations sur le matériau</CardTitle>
              <CardDescription>Entrez les détails du nouveau matériau</CardDescription>
            </CardHeader>
            
            {/* ...existing code for the standard form... */}
          </form>
        </Card>
      )}
      
      {/* Bouton de soumission */}
      <div className="mt-6 flex justify-end">
        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {multiAddMode ? 'Ajout en cours...' : 'Ajout en cours...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {multiAddMode ? `Ajouter ${materialsList.length} matériaux` : 'Ajouter le matériau'}
            </>
          )}
        </Button>
      </div>
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
