'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiPost, apiDelete, useGet } from '@/hooks/useApi';
import { Layers, Plus, Trash2, RefreshCw, Calculator, Edit, Clock, Users, Save } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function OrderGroupsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: groups = [], loading, refetch } = useGet('/api/order-groups');
  
  // Créer un nouveau groupe
  const createGroup = async (e) => {
    e.preventDefault();
    
    if (!newGroupName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await apiPost('/api/order-groups', {
        name: newGroupName.trim(),
        description: newGroupDescription.trim()
      });
      
      toast({
        title: "Groupe créé",
        description: `Le groupe "${newGroupName}" a été créé avec succès.`
      });
      
      setNewGroupName('');
      setNewGroupDescription('');
      setIsCreating(false);
      refetch();
    } catch (error) {
      console.error("Erreur lors de la création du groupe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le groupe.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Supprimer un groupe
  const deleteGroup = async () => {
    if (!selectedGroup?._id) return;
    
    setIsSubmitting(true);
    try {
      await apiDelete(`/api/order-groups/${selectedGroup._id}`);
      
      toast({
        title: "Groupe supprimé",
        description: `Le groupe "${selectedGroup.name}" a été supprimé avec succès.`
      });
      
      setIsDeleting(false);
      setSelectedGroup(null);
      refetch();
    } catch (error) {
      console.error("Erreur lors de la suppression du groupe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le groupe.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format de date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Groupes de Commandes</h1>
          <p className="text-muted-foreground">
            Gérez les groupes de commandes pour calculer les ressources combinées
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau groupe
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des groupes</CardTitle>
          <CardDescription>
            Regroupez plusieurs commandes pour calculer les ressources nécessaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des groupes...
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun groupe de commandes trouvé. Créez votre premier groupe !
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du groupe</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group._id}>
                    <TableCell>
                      <div className="font-medium flex items-center">
                        <Layers className="h-4 w-4 mr-2 text-primary" />
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell>{group.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {group.orderCount || 0} commandes
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(group.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/order-groups/${group._id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8">
                            <Edit className="h-4 w-4 mr-1" />
                            Éditer
                          </Button>
                        </Link>
                        <Link href={`/order-groups/${group._id}/resources`}>
                          <Button variant="outline" size="sm" className="h-8">
                            <Calculator className="h-4 w-4 mr-1" />
                            Ressources
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedGroup(group);
                            setIsDeleting(true);
                          }}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Dialogue pour créer un nouveau groupe */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un groupe de commandes</DialogTitle>
            <DialogDescription>
              Les groupes vous permettent de combiner plusieurs commandes pour calculer les ressources totales nécessaires.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createGroup}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newGroupName">Nom du groupe</Label>
                <Input
                  id="newGroupName"
                  placeholder="Ex: Commandes GDKP 12/05/2023"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newGroupDescription">Description (optionnelle)</Label>
                <Input
                  id="newGroupDescription"
                  placeholder="Description du groupe"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreating(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={!newGroupName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Créer le groupe
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue pour confirmer la suppression */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce groupe ? Les commandes ne seront pas supprimées, mais elles ne seront plus groupées.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 p-3 rounded-md">
              <p><span className="font-medium">Groupe :</span> {selectedGroup?.name}</p>
              {selectedGroup?.description && (
                <p><span className="font-medium">Description :</span> {selectedGroup.description}</p>
              )}
              <p><span className="font-medium">Commandes associées :</span> {selectedGroup?.orderCount || 0}</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleting(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteGroup}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
