'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiPut, apiPost, useGet } from '@/hooks/useApi';
// Fix: Replace Layer with Layers which exists in lucide-react
import { UsersIcon, Layers, Plus, Loader2 } from 'lucide-react';

export default function OrderGroupSelector({ order }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(order?.orderGroupId || '');
  const [newGroupName, setNewGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { data: orderGroups = [], refetch: refetchGroups } = useGet('/api/order-groups');
  
  // Mettre à jour selectedGroupId lorsque l'ordre change
  useEffect(() => {
    if (order?.orderGroupId) {
      setSelectedGroupId(order.orderGroupId);
    }
  }, [order?.orderGroupId]);
  
  // Associer une commande à un groupe existant
  const joinGroup = async (groupId) => {
    if (!order?._id) return;
    
    setIsSubmitting(true);
    try {
      await apiPut(`/api/orders/${order._id}`, { orderGroupId: groupId });
      
      toast({
        title: "Groupe mis à jour",
        description: "La commande a été ajoutée au groupe sélectionné."
      });
      
      setSelectedGroupId(groupId);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du groupe:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la commande au groupe.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Créer un nouveau groupe et y associer la commande
  const createGroup = async () => {
    if (!order?._id || !newGroupName.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Créer le groupe
      const newGroup = await apiPost('/api/order-groups', {
        name: newGroupName.trim(),
        orderIds: [order._id]
      });
      
      toast({
        title: "Groupe créé",
        description: `Le groupe "${newGroupName}" a été créé et la commande y a été ajoutée.`
      });
      
      setSelectedGroupId(newGroup._id);
      setNewGroupName('');
      setIsCreatingGroup(false);
      setIsDialogOpen(false);
      
      // Actualiser la liste des groupes
      refetchGroups();
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
  
  // Supprimer la commande du groupe actuel
  const leaveGroup = async () => {
    if (!order?._id || !order.orderGroupId) return;
    
    setIsSubmitting(true);
    try {
      await apiPut(`/api/orders/${order._id}`, { orderGroupId: null });
      
      toast({
        title: "Groupe mis à jour",
        description: "La commande a été retirée du groupe."
      });
      
      setSelectedGroupId('');
    } catch (error) {
      console.error("Erreur lors du retrait du groupe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer la commande du groupe.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Trouver le nom du groupe actuel - Add null check
  const currentGroupName = selectedGroupId 
    ? (Array.isArray(orderGroups) ? orderGroups.find(g => g._id === selectedGroupId)?.name : null) || "Groupe inconnu"
    : "Aucun groupe";
  
  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {/* Fix: Use Layers instead of Layer */}
            <Layers className="h-4 w-4" />
            {selectedGroupId ? currentGroupName : "Assigner à un groupe"}
          </Button>
        </DialogTrigger>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestion du groupe</DialogTitle>
            <DialogDescription>
              {selectedGroupId 
                ? "Cette commande fait partie d'un groupe. Vous pouvez la transférer vers un autre groupe ou la retirer du groupe actuel."
                : "Assignez cette commande à un groupe pour calculer les ressources combinées de plusieurs commandes."}
            </DialogDescription>
          </DialogHeader>
          
          {isCreatingGroup ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Nom du nouveau groupe</Label>
                <Input 
                  id="groupName" 
                  placeholder="Ex: Commandes GDKP 12/05/2023"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreatingGroup(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={createGroup} 
                  disabled={!newGroupName.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer et assigner
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group">Groupe de commandes</Label>
                <Select value={selectedGroupId} onValueChange={(value) => setSelectedGroupId(value)}>
                  <SelectTrigger id="group">
                    <SelectValue placeholder="Sélectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun groupe</SelectItem>
                    {Array.isArray(orderGroups) && orderGroups.map((group) => (
                      <SelectItem key={group._id} value={group._id}>
                        {group.name} ({group.orderCount || 0} commandes)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreatingGroup(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau groupe
                </Button>
                
                <div className="space-x-2">
                  {order.orderGroupId && (
                    <Button 
                      variant="destructive" 
                      onClick={leaveGroup}
                      disabled={isSubmitting || !selectedGroupId}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Retirer du groupe
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => joinGroup(selectedGroupId)}
                    disabled={isSubmitting || selectedGroupId === order.orderGroupId}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Assigner au groupe
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
