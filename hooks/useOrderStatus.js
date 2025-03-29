'use client';

import { useState, useCallback } from 'react';
import { apiPut } from '@/hooks/useApi';

/**
 * Hook pour gérer les mises à jour de statut des commandes
 */
export function useOrderStatus(initialStatus, orderId) {
  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const updateStatus = useCallback(async (newStatus) => {
    if (!orderId || newStatus === status) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await apiPut(`/api/orders/${orderId}`, { status: newStatus });
      setStatus(newStatus);
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError(err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [orderId, status]);
  
  // Retourner un objet et non une fonction pour éviter les erreurs "is not a function"
  return {
    status,
    isUpdating,
    error,
    updateStatus
  };
}
