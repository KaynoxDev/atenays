'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useGet, apiPost } from '@/hooks/useApi';
import { ArrowLeft, Save, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

export default function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams ? searchParams.get('clientId') : null;
  const { toast, success, error: showError } = useToast();
  
  const { data: clients = [], loading: loadingClients } = useGet('/api/clients');
  const { data: selectedClient, loading: loadingSelectedClient } = useGet(
    clientId ? `/api/clients/${clientId}` : null
  );
  const { data: professionsList = [], loading: loadingProfessions } = useGet('/api/professions', []);
  
  // État de base de la commande
  const [order, setOrder] = useState({
    clientId: clientId || '',
    clientName: '',
    clientRealm: '',
    character: '',
    professions: [
      { name: '', levelRange: '525', price: 0, materials: [] }
    ],
    status: 'pending',
    notes: '',
    initialPayment: 0
  });
  
  // Prix total calculé à partir de toutes les professions
  const totalPrice = useMemo(() => {
    return order.professions.reduce((sum, prof) => sum + (Number(prof.price) || 0), 0);
  }, [order.professions]);
  
  // Mettre à jour le prix total lorsqu'il change
  useEffect(() => {
    setOrder(prev => ({ ...prev, price: totalPrice }));
  }, [totalPrice]);
  
  // Si un client est pré-sélectionné via les paramètres d'URL
  useEffect(() => {
    if (selectedClient && clientId) {
      setOrder(prev => ({
        ...prev,
        clientId,
        clientName: selectedClient.name,
        clientRealm: selectedClient.realm,
        character: selectedClient.character || ''
      }));
    }
  }, [selectedClient, clientId]);
  
  // Lorsqu'un client est sélectionné dans le dropdown
  const handleClientChange = (value) => {
    const selected = clients.find(client => client._id === value);
    
    if (selected) {
      setOrder(prev => ({
        ...prev,
        clientId: selected._id,
        clientName: selected.name,
        clientRealm: selected.realm,
        character: selected.character || ''
      }));
    }
  };
  
  // Pour les champs généraux
  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrder(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Pour les champs de type Select généraux
  const handleSelectChange = (name, value) => {
    setOrder(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Mise à jour des informations de profession
  const handleProfessionChange = (index, field, value) => {
    const newProfessions = [...order.professions];
    newProfessions[index][field] = value;
    
    // Récupérer le prix suggéré si une profession est sélectionnée et aucun prix n'est défini
    if (field === 'name' && (!newProfessions[index].price || newProfessions[index].price === 0)) {
      const selectedProfInfo = professionsList.find(p => p && p.name === value);
      if (selectedProfInfo && selectedProfInfo.priceRanges) {
        const levelRange = newProfessions[index].levelRange || '525';
        const priceRange = selectedProfInfo.priceRanges[levelRange];
        if (priceRange) {
          // Utiliser le milieu de la fourchette de prix comme suggestion
          const suggestedPrice = Math.floor((priceRange.min + priceRange.max) / 2);
          newProfessions[index].price = suggestedPrice;
        }
      }
    }
    
    // Mettre à jour le levelRange en fonction de la profession sélectionnée
    if (field === 'levelRange') {
      const selectedProfInfo = professionsList.find(p => p && p.name === newProfessions[index].name);
      if (selectedProfInfo && selectedProfInfo.priceRanges) {
        const priceRange = selectedProfInfo.priceRanges[value];
        if (priceRange) {
          // Utiliser le milieu de la fourchette de prix comme suggestion
          const suggestedPrice = Math.floor((priceRange.min + priceRange.max) / 2);
          newProfessions[index].price = suggestedPrice;
        }
      }
    }
    
    setOrder(prev => ({
      ...prev,
      professions: newProfessions
    }));
  };
  
  // Ajouter une profession à la commande
  const addProfession = () => {
    setOrder(prev => ({
      ...prev,
      professions: [
        ...prev.professions,
        { name: '', levelRange: '525', price: 0, materials: [] }
      ]
    }));
  };
  
  // Supprimer une profession de la commande
  const removeProfession = (index) => {
    if (order.professions.length <= 1) {
      showError({
        title: "Impossible de supprimer",
        description: "La commande doit contenir au moins une profession."
      });
      return;
    }
    
    const newProfessions = [...order.professions];
    newProfessions.splice(index, 1);
    setOrder(prev => ({ ...prev, professions: newProfessions }));
  };

  // Cette fonction doit être protégée contre les valeurs null/undefined
  const getProfessionLevelRanges = (profName) => {
    if (!profName || !Array.isArray(professionsList)) return ['525'];
    
    const profession = professionsList.find(p => p && p.name === profName);
    
    // Vérifier que profession et priceRanges existent avant de continuer
    if (!profession || !profession.priceRanges) return ['525'];
    
    // S'assurer que priceRanges est un objet avec des clés
    return Object.keys(profession.priceRanges).length > 0 
      ? Object.keys(profession.priceRanges) 
      : ['525'];
  };
  
  // Fonction soumission du formulaire corrigée
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validation de base
      if (!order.clientId) {
        toast({
          title: "Client requis",
          description: "Veuillez sélectionner un client."
        });
        return;
      }
      
      if (order.professions.some(p => !p.name)) {
        showError({
          title: "Profession requise",
          description: "Veuillez sélectionner une profession pour chaque ligne."
        });
        return;
      }
      
      if (totalPrice <= 0) {
        showError({
          title: "Prix invalide",
          description: "Le prix total doit être supérieur à 0."
        });
        return;
      }
      
      // Ajouter la date de création
      const newOrder = {
        ...order,
        createdAt: new Date().toISOString(),
        // Convertir les montants en nombres
        price: totalPrice,
        initialPayment: Number(order.initialPayment) || 0,
        // Assurer que tous les prix de profession sont des nombres
        professions: order.professions.map(p => ({
          ...p,
          price: Number(p.price) || 0
        }))
      };
      
      const result = await apiPost('/api/orders', newOrder);
      
      toast({
        title: "Commande créée",
        description: "La commande a été créée avec succès."
      });
      
      // Rediriger vers la page de détails de la commande
      if (result && result._id) {
        router.push(`/orders/${result._id}`);
      } else {
        router.push('/orders');
      }
    } catch (err) {
      console.error('Erreur lors de la création de la commande:', err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la commande."
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Nouvelle Commande</h1>
          <p className="text-muted-foreground">Créer une nouvelle commande de service</p>
        </div>
        <Link href="/orders">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Button>
        </Link>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Info client */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Client</CardTitle>
              <CardDescription>Informations sur le client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clientId">Client</Label>
                <Select 
                  value={order.clientId} 
                  onValueChange={handleClientChange}
                  disabled={clientId !== null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(clients) && clients.map(client => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name} - {client.realm || 'Royaume non spécifié'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!order.clientId && (
                  <Link href="/clients/new" className="text-xs text-primary block mt-1 hover:underline">
                    + Créer un nouveau client
                  </Link>
                )}
              </div>
              
              {order.clientId && (
                <>
                  <div>
                    <Label htmlFor="character">Personnage</Label>
                    <Input
                      id="character"
                      name="character"
                      value={order.character}
                      onChange={handleChange}
                      placeholder="Nom du personnage"
                    />
                  </div>
                  
                  <div className="text-sm">
                    <p><span className="font-medium">Client:</span> {order.clientName}</p>
                    <p><span className="font-medium">Royaume:</span> {order.clientRealm || 'Non spécifié'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Détails de la commande */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Professions</CardTitle>
              <CardDescription>Sélectionnez les professions et niveaux souhaités</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.professions.map((profession, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Profession #{index + 1}</h3>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeProfession(index)}
                      >
                        <Minus className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Profession</Label>
                        <Select 
                          value={profession.name} 
                          onValueChange={(value) => handleProfessionChange(index, 'name', value)}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Sélectionner une profession" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Afficher un message si pas de professions */}
                            {loadingProfessions && <SelectItem value="loading" disabled>Chargement...</SelectItem>}
                            {!loadingProfessions && (!Array.isArray(professionsList) || professionsList.length === 0) && 
                              <SelectItem value="no-data" disabled>Aucune profession disponible</SelectItem>
                            }
                            
                            {/* Afficher les professions disponibles */}
                            {Array.isArray(professionsList) && professionsList.map(prof => prof && (
                              <SelectItem key={prof.name} value={prof.name || `profession-${index}`}>
                                {prof.icon && <span className="mr-2">{prof.icon}</span>}
                                {prof.name || "Profession sans nom"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Niveau Cible</Label>
                        <Select 
                          value={profession.levelRange} 
                          onValueChange={(value) => handleProfessionChange(index, 'levelRange', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Niveau" />
                          </SelectTrigger>
                          <SelectContent>
                            {getProfessionLevelRanges(profession.name).map(level => (
                              <SelectItem key={level} value={level}>
                                1-{level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Prix</Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={profession.price}
                            onChange={(e) => handleProfessionChange(index, 'price', e.target.value)}
                            className="mr-2"
                          />
                          <span>or</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProfession}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une profession
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Paiement et notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Paiement</CardTitle>
              <CardDescription>Détails du paiement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Prix Total</Label>
                <div className="flex items-center">
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={totalPrice}
                    disabled
                    className="mr-2"
                  />
                  <span>or</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="initialPayment">Acompte Initial</Label>
                <div className="flex items-center">
                  <Input
                    id="initialPayment"
                    name="initialPayment"
                    type="number"
                    value={order.initialPayment}
                    onChange={handleChange}
                    className="mr-2"
                    max={totalPrice}
                  />
                  <span>or</span>
                </div>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span>Reste à payer:</span>
                  <span className="font-bold">{totalPrice - Number(order.initialPayment || 0)} or</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Informations supplémentaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="notes"
                value={order.notes}
                onChange={handleChange}
                placeholder="Ajouter des notes ou instructions spéciales..."
                rows={5}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Créer la commande
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
