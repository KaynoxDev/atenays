'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useGet, apiPut, apiPost, apiDelete } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Edit, Plus, Save, Trash2, RefreshCw, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminProfessionsPage() {
  const { data: professions = [], loading, refetch } = useGet('/api/professions');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProfession, setCurrentProfession] = useState(null);
  const { toast, success, error } = useToast();
  
  const defaultPriceRanges = {
    '225': { min: 100, max: 200 },
    '300': { min: 200, max: 400 },
    '375': { min: 300, max: 600 },
    '450': { min: 400, max: 800 },
    '525': { min: 500, max: 1000 }
  };

  const handleAddNew = () => {
    setCurrentProfession({
      name: '',
      icon: '',
      description: '',
      priceRanges: { ...defaultPriceRanges }
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (profession) => {
    setCurrentProfession({
      ...profession,
      priceRanges: profession.priceRanges || { ...defaultPriceRanges }
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (profession) => {
    setCurrentProfession(profession);
    setIsDeleteDialogOpen(true);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProfession(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceRangeChange = (level, field, value) => {
    setCurrentProfession(prev => ({
      ...prev,
      priceRanges: {
        ...prev.priceRanges,
        [level]: {
          ...prev.priceRanges[level],
          [field]: parseInt(value) || 0
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      if (!currentProfession.name) {
        error({ title: "Erreur", description: "Le nom de la profession est requis" });
        return;
      }
      
      // Create a clean copy to avoid issues with circular references or non-serializable data
      const professionToSave = { 
        name: currentProfession.name,
        icon: currentProfession.icon || '',
        description: currentProfession.description || '',
        priceRanges: currentProfession.priceRanges || {}
      };
      
      // Make sure all priceRanges are properly formatted with numeric values
      Object.keys(professionToSave.priceRanges).forEach(level => {
        professionToSave.priceRanges[level] = {
          min: parseInt(professionToSave.priceRanges[level].min) || 0,
          max: parseInt(professionToSave.priceRanges[level].max) || 0
        };
      });
      
      if (currentProfession._id) {
        // Mise à jour d'une profession existante
        const result = await apiPut(`/api/professions/${currentProfession._id}`, professionToSave);
        console.log("Profession updated:", result);
        success({ 
          title: "Profession mise à jour", 
          description: `${currentProfession.name} a été mis à jour avec succès.` 
        });
      } else {
        // Création d'une nouvelle profession
        const result = await apiPost('/api/professions', professionToSave);
        console.log("Profession created:", result);
        success({ 
          title: "Profession créée", 
          description: `${currentProfession.name} a été créé avec succès.` 
        });
      }
      
      setIsDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la profession:', err);
      const errorMessage = err.message || 
                           err.response?.data?.error || 
                           "Une erreur est survenue lors de l'enregistrement de la profession.";
      
      error({ 
        title: "Erreur", 
        description: errorMessage
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await apiDelete(`/api/professions/${currentProfession._id}`);
      success({ 
        title: "Profession supprimée", 
        description: `${currentProfession.name} a été supprimé avec succès.` 
      });
      setIsDeleteDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Erreur lors de la suppression de la profession:', err);
      error({ 
        title: "Erreur", 
        description: "Une erreur est survenue lors de la suppression de la profession." 
      });
    }
  };

  // Liste des émojis pour les professions
  const professionsEmojis = [
    { name: 'Blacksmithing', emoji: '🔨' },
    { name: 'Tailoring', emoji: '🧵' },
    { name: 'Leatherworking', emoji: '🧶' },
    { name: 'Engineering', emoji: '⚙️' },
    { name: 'Alchemy', emoji: '⚗️' },
    { name: 'Enchanting', emoji: '✨' },
    { name: 'Jewelcrafting', emoji: '💎' },
    { name: 'Inscription', emoji: '📜' },
    { name: 'Cooking', emoji: '🍳' },
    { name: 'First Aid', emoji: '🩹' },
    { name: 'Fishing', emoji: '🎣' },
    { name: 'Mining', emoji: '⛏️' },
    { name: 'Herbalism', emoji: '🌿' },
    { name: 'Skinning', emoji: '🔪' },
  ];

  // Ensure professions is always an array, even during loading or error states
  const safelyRenderProfessions = () => {
    if (!Array.isArray(professions)) return [];
    return professions;
  };

  // Calculate profession count safely
  const professionsCount = Array.isArray(professions) ? professions.length : 0;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestion des Professions</h1>
          <p className="text-muted-foreground">Gérez les professions disponibles et leurs tarifs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une profession
          </Button>
        </div>
      </div>

      <Alert className="mb-6 bg-blue-50 border border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          Les professions que vous créez ici seront disponibles dans les formulaires de commande et les calculs de matériaux.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Professions</CardTitle>
          <CardDescription>
            {professionsCount} professions configurées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icône</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Prix 1-525</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safelyRenderProfessions().map((profession) => (
                <TableRow key={profession._id}>
                  <TableCell>
                    <span className="text-2xl">{profession.icon}</span>
                  </TableCell>
                  <TableCell className="font-medium">{profession.name}</TableCell>
                  <TableCell>{profession.description || '-'}</TableCell>
                  <TableCell>
                    {profession.priceRanges?.['525'] 
                      ? `${profession.priceRanges['525'].min} - ${profession.priceRanges['525'].max} or`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(profession)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(profession)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {professionsCount === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {loading ? "Chargement des professions..." : "Aucune profession configurée"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Boîte de dialogue d'édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {currentProfession?._id ? 'Modifier la profession' : 'Ajouter une profession'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la profession</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentProfession?.name || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon">Icône (emoji)</Label>
                <div className="flex gap-2">
                  <Input
                    id="icon"
                    name="icon"
                    value={currentProfession?.icon || ''}
                    onChange={handleInputChange}
                  />
                  <div className="text-xl p-2 border rounded-md min-w-[52px] flex justify-center">
                    {currentProfession?.icon || ' '}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={currentProfession?.description || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="border rounded-md p-4">
              <h4 className="font-medium mb-3">Plages de prix par niveau</h4>
              
              <Tabs defaultValue="525">
                <TabsList className="mb-4">
                  <TabsTrigger value="225">1-225</TabsTrigger>
                  <TabsTrigger value="300">1-300</TabsTrigger>
                  <TabsTrigger value="375">1-375</TabsTrigger>
                  <TabsTrigger value="450">1-450</TabsTrigger>
                  <TabsTrigger value="525">1-525</TabsTrigger>
                </TabsList>
                
                {['225', '300', '375', '450', '525'].map((level) => (
                  <TabsContent key={level} value={level} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label>Prix minimum</Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={currentProfession?.priceRanges?.[level]?.min || 0}
                            onChange={(e) => handlePriceRangeChange(level, 'min', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label>Prix maximum</Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={currentProfession?.priceRanges?.[level]?.max || 0}
                            onChange={(e) => handlePriceRangeChange(level, 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cette fourchette de prix sera suggérée lors de la création de commandes pour {currentProfession?.name || 'cette profession'} niveau 1-{level}.
                    </p>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
            
            <div className="border rounded-md p-4">
              <h4 className="font-medium mb-3">Émojis disponibles</h4>
              <div className="flex flex-wrap gap-3">
                {professionsEmojis.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="p-2 border rounded hover:bg-muted cursor-pointer flex flex-col items-center text-xs"
                    onClick={() => {
                      setCurrentProfession(prev => ({
                        ...prev,
                        icon: item.emoji,
                        name: prev.name || item.name
                      }));
                    }}
                  >
                    <span className="text-xl mb-1">{item.emoji}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
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

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer cette profession : 
            <span className="font-bold"> {currentProfession?.name}</span> ?
          </p>
          <p className="text-muted-foreground mt-2">
            Cette action est irréversible et pourrait affecter les commandes existantes utilisant cette profession.
          </p>
          <DialogFooter>
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
