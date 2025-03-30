"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiPut } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Calendar, Edit, Save, CheckCircle2, FileText, Clock, Check, AlertTriangle, Ban, Printer } from 'lucide-react';
import OrderGroupSelector from '@/components/ui/OrderGroupSelector';
import Link from 'next/link';

export default function OrderDetails({ order, onUpdateOrder, onUpdateStatus }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState(order);
  const [activeTab, setActiveTab] = useState('details');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const { toast, success, error: showError } = useToast();

  if (!order) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedOrder(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Créer une copie sans l'_id pour éviter les erreurs MongoDB
      const orderToUpdate = { ...editedOrder };
      if (orderToUpdate._id) {
        delete orderToUpdate._id;
      }
      
      await apiPut(`/api/orders/${order._id}`, orderToUpdate);
      setIsEditing(false);
      if (onUpdateOrder) {
        onUpdateOrder();
      }
      success({
        title: "Commande mise à jour",
        description: "Les modifications ont été enregistrées avec succès."
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la commande:', err);
      showError({
        title: "Échec de la mise à jour",
        description: "Une erreur est survenue lors de la mise à jour de la commande."
      });
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showError({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide."
      });
      return;
    }
    
    // Mise à jour de l'acompte
    const updatedOrder = {
      ...order,
      initialPayment: (order.initialPayment || 0) + amount,
      paymentHistory: [
        ...(order.paymentHistory || []),
        {
          amount,
          date: new Date().toISOString(),
          note: paymentNote
        }
      ]
    };
    
    try {
      apiPut(`/api/orders/${order._id}`, updatedOrder).then(() => {
        setIsPaymentDialogOpen(false);
        setPaymentAmount('');
        setPaymentNote('');
        if (onUpdateOrder) {
          onUpdateOrder();
        }
        success({
          title: "Paiement enregistré",
          description: `Paiement de ${amount} or enregistré avec succès.`
        });
      });
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du paiement:", err);
      showError({
        title: "Échec de l'enregistrement",
        description: "Une erreur est survenue lors de l'enregistrement du paiement."
      });
    }
  };

  // Calculate remaining payment
  const remainingPayment = order.price - (order.initialPayment || 0);

  // Determine possible status transitions based on current status
  const getStatusTransitions = () => {
    switch (order.status) {
      case 'pending':
        return [
          { value: 'in-progress', label: 'Débuter la commande', color: 'bg-amber-500 hover:bg-amber-600' },
          { value: 'cancelled', label: 'Annuler', color: 'bg-destructive hover:bg-destructive/90' }
        ];
      case 'in-progress':
        return [
          { value: 'completed', label: 'Marquer comme terminée', color: 'bg-green-500 hover:bg-green-600' },
          { value: 'cancelled', label: 'Annuler', color: 'bg-destructive hover:bg-destructive/90' }
        ];
      case 'completed':
        return [];
      case 'cancelled':
        return [
          { value: 'pending', label: 'Réactiver', color: 'bg-blue-500 hover:bg-blue-600' }
        ];
      default:
        return [];
    }
  };

  const statusTransitions = getStatusTransitions();

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      // Créer un nouvel objet sans inclure l'_id pour la mise à jour
      const orderForUpdate = {
        ...order,
        status: newStatus,
        // Si le statut est "terminé", ajouter la date d'achèvement
        ...(newStatus === 'completed' ? { completedAt: new Date().toISOString() } : {})
      };
      
      // Supprimer l'_id pour éviter l'erreur MongoDB
      delete orderForUpdate._id;
      
      await apiPut(`/api/orders/${order._id}`, orderForUpdate);
      
      if (onUpdateStatus) {
        onUpdateStatus(newStatus);
      }
      
      success({
        title: "Statut mis à jour",
        description: `Le statut a été changé en "${getStatusName(newStatus)}".`
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      showError({
        title: "Échec de la mise à jour",
        description: "Une erreur est survenue lors de la mise à jour du statut."
      });
    }
  };

  // Format the professions list
  const renderProfessions = () => {
    // Si nouvelle structure de données avec array de professions
    if (order.professions && Array.isArray(order.professions) && order.professions.length > 0) {
      return (
        <div className="space-y-1">
          {order.professions.map((prof, index) => (
            <div key={index} className="flex items-center">
              <span className="text-xl mr-2">{getProfessionEmoji(prof.name)}</span>
              <span>{prof.name} 1-{prof.levelRange || '525'}</span>
              <span className="ml-auto font-medium">{prof.price} or</span>
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback pour l'ancienne structure de données
    return (
      <div className="flex items-center">
        <span className="text-xl mr-2">{getProfessionEmoji(order.profession)}</span>
        <span>{order.profession} 1-{order.levelRange || '525'}</span>
      </div>
    );
  };
  
  function getStatusName(status) {
    const translations = {
      'pending': 'En attente',
      'in-progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return translations[status] || status;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Détails de la commande</CardTitle>
                <CardDescription>
                  Commande pour {order.clientName} ({order.clientRealm || 'Royaume inconnu'})
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeStyle(order.status)}>
                {getStatusName(order.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1">Client</h3>
                <p>{order.clientName}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Personnage</h3>
                <p>{order.character || 'Non spécifié'}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Profession(s)</h3>
                {renderProfessions()}
              </div>
              <div>
                <h3 className="font-medium mb-1">Date de création</h3>
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            {order.notes && (
              <div>
                <h3 className="font-medium mb-1">Notes</h3>
                <p className="text-muted-foreground">{order.notes}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Modifier
              </Button>
              
              <div className="flex items-center gap-2">
                {statusTransitions.map(transition => (
                  <Button
                    key={transition.value}
                    className={transition.color}
                    onClick={() => handleStatusChange(transition.value)}
                  >
                    {transition.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              <OrderGroupSelector order={order} />
              {/* Modifier le bouton PDF pour ouvrir la page d'impression au lieu de télécharger un PDF */}
              <Link href={`/orders/${order._id}/print`} target="_blank">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" /> {/* Utiliser l'icône Printer au lieu de FilePdf */}
                  Imprimer
                </Button>
              </Link>
            </div>
            
            {/* Boutons existants */}
            <div className="flex gap-2">
              {/* ...existing buttons... */}
            </div>
          </CardFooter>
        </Card>
        
        {order.status === 'completed' && order.completedAt && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Commande terminée
              </CardTitle>
              <CardDescription>
                Cette commande a été marquée comme terminée le {new Date(order.completedAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        
        {order.status === 'cancelled' && (
          <Card className="mt-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Commande annulée
              </CardTitle>
              <CardDescription>
                Cette commande a été annulée
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
      
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Prix total:</span>
              <span className="font-bold">{order.price} or</span>
            </div>
            <div className="flex justify-between">
              <span>Acompte reçu:</span>
              <span>{order.initialPayment || 0} or</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg">
                <span>Reste à payer:</span>
                <span className="font-bold">{remainingPayment} or</span>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => setIsPaymentDialogOpen(true)}
              disabled={order.status === 'completed' || order.status === 'cancelled' || remainingPayment <= 0}
            >
              Enregistrer un paiement
            </Button>
            
            {order.paymentHistory && order.paymentHistory.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Historique des paiements</h3>
                <div className="border rounded-md divide-y">
                  {order.paymentHistory.map((payment, index) => (
                    <div key={index} className="p-2 text-sm">
                      <div className="flex justify-between">
                        <span>{new Date(payment.date).toLocaleDateString()}</span>
                        <span className="font-medium">{payment.amount} or</span>
                      </div>
                      {payment.note && <p className="text-muted-foreground text-xs mt-1">{payment.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informations supplémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>ID de commande:</span>
              <span className="font-mono text-sm">{order._id}</span>
            </div>
            <div className="flex justify-between">
              <span>Créée le:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            {order.completedAt && (
              <div className="flex justify-between">
                <span>Terminée le:</span>
                <span>{new Date(order.completedAt).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modal d'édition */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la commande</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la commande
            </DialogDescription>
          </DialogHeader>
          {editedOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={editedOrder.notes || ''}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Instructions spéciales, informations supplémentaires..."
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="character">Personnage</Label>
                <Input
                  id="character"
                  name="character"
                  value={editedOrder.character || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  name="status"
                  value={editedOrder.status}
                  onValueChange={(value) => handleInputChange({ target: { name: 'status', value } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in-progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de paiement */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Indiquez le montant reçu pour cette commande
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentAmount">Montant (or)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  max={remainingPayment}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Montant en or"
                />
                <p className="text-xs text-muted-foreground">Reste à payer: {remainingPayment} or</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="paymentNote">Note (optionnel)</Label>
                <Textarea
                  id="paymentNote"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Détails du paiement..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Enregistrer le paiement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getProfessionEmoji(profession) {
  const icons = {
    'Blacksmithing': '🔨',
    'Tailoring': '🧵',
    'Leatherworking': '🧶',
    'Engineering': '⚙️',
    'Alchemy': '⚗️',
    'Enchanting': '✨',
    'Jewelcrafting': '💎',
    'Inscription': '📜',
  };
  return icons[profession] || '📋';
}
