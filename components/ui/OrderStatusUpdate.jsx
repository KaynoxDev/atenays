'use client';

import { useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { apiPut } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function OrderStatusUpdate({ orderId, currentStatus, onStatusChange }) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  const handleUpdateStatus = async () => {
    if (status === currentStatus || !orderId) return;
    
    setIsUpdating(true);
    try {
      await apiPut(`/api/orders/${orderId}`, { status });
      
      // Notifier le composant parent du changement
      if (typeof onStatusChange === 'function') {
        onStatusChange(status);
      }
      
      toast({
        title: "Statut mis à jour",
        description: `La commande est maintenant ${getStatusName(status)}.`
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la commande.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Noms des statuts pour l'affichage
  const getStatusName = (statusValue) => {
    const statusMap = {
      'pending': 'En attente',
      'in-progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return statusMap[statusValue] || statusValue;
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Choisir un statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="in-progress">En cours</SelectItem>
          <SelectItem value="completed">Terminée</SelectItem>
          <SelectItem value="cancelled">Annulée</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        onClick={handleUpdateStatus}
        disabled={status === currentStatus || isUpdating}
        variant="secondary"
        size="sm"
      >
        {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Mettre à jour
      </Button>
    </div>
  );
}
