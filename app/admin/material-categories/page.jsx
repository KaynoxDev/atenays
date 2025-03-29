'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGet, apiPost, apiPut, apiDelete } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Edit, Plus, Save, Trash2, RefreshCw, Tag } from 'lucide-react';
import Link from 'next/link';

export default function MaterialCategoriesPage() {
  const { data: categories = [], loading, refetch } = useGet('/api/material-categories');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const { toast } = useToast();
  
  // Ensure categories is always an array, even when API returns null
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  const handleAddNew = () => {
    setCurrentCategory({
      name: '',
      description: '',
      icon: '',
      color: '#3b82f6'
    });
    setIsDialogOpen(true);
  };
  
  const handleEdit = (category) => {
    setCurrentCategory({...category});
    setIsDialogOpen(true);
  };
  
  const handleDelete = (category) => {
    setCurrentCategory(category);
    setIsDeleteDialogOpen(true);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    try {
      if (!currentCategory.name) {
        toast({
          title: "Erreur",
          description: "Le nom de la catégorie est requis",
          variant: "destructive"
        });
        return;
      }
      
      // Create a clean copy of the data to send to the API
      const categoryData = { ...currentCategory };
      
      // If we're updating, ensure the _id is a string (not an object)
      if (categoryData._id && typeof categoryData._id === 'object') {
        categoryData._id = categoryData._id.toString();
      }
      
      if (categoryData._id) {
        // Mise à jour d'une catégorie existante
        await apiPut(`/api/material-categories/${categoryData._id}`, categoryData);
        toast({
          title: "Catégorie mise à jour",
          description: `${categoryData.name} a été mise à jour avec succès.`
        });
      } else {
        // Création d'une nouvelle catégorie
        await apiPost('/api/material-categories', categoryData);
        toast({
          title: "Catégorie créée",
          description: `${categoryData.name} a été créée avec succès.`
        });
      }
      
      setIsDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la catégorie:', err);
      toast({
        title: "Erreur",
        description: err.response?.data?.error || err.message || "Une erreur est survenue lors de l'enregistrement de la catégorie.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await apiDelete(`/api/material-categories/${currentCategory._id}`);
      toast({
        title: "Catégorie supprimée",
        description: `${currentCategory.name} a été supprimée avec succès.`
      });
      setIsDeleteDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Erreur lors de la suppression de la catégorie:', err);
      toast({
        title: "Erreur",
        description: err.response?.data?.error || "Une erreur est survenue lors de la suppression de la catégorie.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Catégories de Matériaux</h1>
          <p className="text-muted-foreground">Gérez les catégories pour faciliter le farming des ressources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle catégorie
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des catégories</CardTitle>
                <CardDescription>Organisez vos matériaux par type pour faciliter leur gestion</CardDescription>
              </div>
              <Link href="/admin/materials">
                <Button variant="outline" size="sm">
                  Gérer les matériaux
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Couleur</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Icône</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeCategories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell>
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: category.color || '#3b82f6' }}
                      ></div>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>{category.icon || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(category)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {safeCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {loading ? "Chargement des catégories..." : "Aucune catégorie disponible"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog pour ajouter/éditer une catégorie */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentCategory?._id ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
            </DialogTitle>
            <DialogDescription>
              Les catégories vous aident à organiser les matériaux par type pour faciliter le farming.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la catégorie</Label>
              <Input
                id="name"
                name="name"
                value={currentCategory?.name || ''}
                onChange={handleInputChange}
                placeholder="Minerais, Herbes, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={currentCategory?.description || ''}
                onChange={handleInputChange}
                placeholder="Description de la catégorie..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icône (emoji ou texte)</Label>
                <Input
                  id="icon"
                  name="icon"
                  value={currentCategory?.icon || ''}
                  onChange={handleInputChange}
                  placeholder="📦 ou texte"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={currentCategory?.color || '#3b82f6'}
                    onChange={handleInputChange}
                    className="w-10 h-10 p-1 rounded border"
                  />
                  <Input
                    name="color"
                    value={currentCategory?.color || '#3b82f6'}
                    onChange={handleInputChange}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-md bg-muted mt-2">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: currentCategory?.color || '#3b82f6' }}
                ></div>
                <span>Aperçu : </span>
                <span 
                  className="px-2 py-1 text-sm rounded-md" 
                  style={{ 
                    backgroundColor: `${currentCategory?.color || '#3b82f6'}20`,
                    color: currentCategory?.color || '#3b82f6',
                    border: `1px solid ${currentCategory?.color || '#3b82f6'}40` 
                  }}
                >
                  {currentCategory?.icon} {currentCategory?.name || 'Nom de la catégorie'}
                </span>
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
      
      {/* Dialog de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer la catégorie <strong>{currentCategory?.name}</strong> ?
          </p>
          <p className="text-muted-foreground mt-2">
            Cette action est irréversible. Les matériaux associés à cette catégorie ne seront pas supprimés,
            mais ne seront plus associés à aucune catégorie.
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
