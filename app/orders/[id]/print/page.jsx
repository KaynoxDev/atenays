'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGet } from '@/hooks/useApi';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderPrintPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await apiGet(`/api/orders/${id}`);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order data.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // Auto-print when ready
    const timer = setTimeout(() => {
      if (!loading && !error && order) {
        window.print();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status name
  const getStatusName = (status) => {
    const statusMap = {
      'pending': 'En attente',
      'in-progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return statusMap[status] || 'Inconnu';
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-50 border-green-200';
      case 'in-progress': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'pending': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Préparation du document pour impression...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-destructive mb-4">Erreur</h1>
        <p>{error || "Impossible de charger les données de la commande."}</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => router.back()}
        >
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto print:p-0">
      {/* Header - Only shows in browser, not when printing */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          Retour
        </Button>
        <Button onClick={() => window.print()}>
          Imprimer / Sauvegarder en PDF
        </Button>
      </div>

      {/* Document title */}
      <div className="border-b-2 border-blue-500 pb-4 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Aténays - Détail de commande</h1>
            <p className="text-lg text-gray-600">Facture #{order._id.substring(0, 8)}</p>
          </div>
          <div className={`px-4 py-2 rounded-md border ${getStatusColorClass(order.status)}`}>
            {getStatusName(order.status)}
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold bg-gray-100 px-3 py-2 rounded mb-4">Informations client</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><span className="font-semibold">Client:</span> {order.clientName}</p>
            <p><span className="font-semibold">Royaume:</span> {order.clientRealm || 'Non spécifié'}</p>
            <p><span className="font-semibold">Personnage:</span> {order.character || 'Non spécifié'}</p>
          </div>
          <div>
            <p><span className="font-semibold">Date de commande:</span> {formatDate(order.createdAt)}</p>
            <p><span className="font-semibold">Référence:</span> {order._id}</p>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold bg-gray-100 px-3 py-2 rounded mb-4">Services commandés</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border py-2 px-3 text-left">Service</th>
              <th className="border py-2 px-3 text-left">Niveau</th>
              <th className="border py-2 px-3 text-right">Prix (or)</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(order.professions) && order.professions.map((prof, idx) => (
              <tr key={idx}>
                <td className="border py-2 px-3">{prof.name || 'Service non spécifié'}</td>
                <td className="border py-2 px-3">1-{prof.levelRange || '525'}</td>
                <td className="border py-2 px-3 text-right">{prof.price || 0}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td className="border py-2 px-3" colSpan="2">TOTAL</td>
              <td className="border py-2 px-3 text-right">{order.price || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Information */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold bg-gray-100 px-3 py-2 rounded mb-4">Informations de paiement</h2>
        <div className="grid grid-cols-2 gap-y-2">
          <div className="font-semibold">Montant total:</div>
          <div className="text-right">{order.price || 0} or</div>
          
          <div className="font-semibold">Acompte versé:</div>
          <div className="text-right">{order.initialPayment || 0} or</div>
          
          <div className="font-semibold border-t pt-1">Reste à payer:</div>
          <div className="text-right font-bold border-t pt-1">
            {(order.price || 0) - (order.initialPayment || 0)} or
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold bg-gray-100 px-3 py-2 rounded mb-4">Notes</h2>
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p>{order.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-4 border-t text-center text-sm text-gray-500">
        <p>Document généré le {new Date().toLocaleDateString()} par Aténays.</p>
        <p>Ce document fait office de reçu pour la commande.</p>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 20mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
