'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPut, useGet } from '@/hooks/useApi';
import { ArrowLeft, Save, Search, Loader2, X } from 'lucide-react';
import Link from 'next/link';

export default function EditOrderGroupPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Récupérer les données du groupe
  const { data: group, loading: loadingGroup, error: groupError } = useGet(`/api/order-groups/${id}`);
  
  // Récupérer toutes les commandes disponibles
  const { data: allOrders = [], loading: loadingOrders } = useGet('/api/orders');
  
  // Filtrer les commandes selon la recherche
  const filteredOrders = allOrders.filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.clientName?.toLowerCase().includes(searchLower) ||
      order.character?.toLowerCase().includes(searchLower) ||
      order._id?.includes(searchLower)
    );
  });
  
  // Initialiser les données du groupe
  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setGroupDescription(group.description || '');
      
      // Extraire les IDs des commandes déjà dans le groupe
      if (Array.isArray(group.orders)) {
        setSelectedOrders(group.orders.map(order => order._id));
      }
    }
  }, [group]);
  
  // Gérer la sélection/désélection d'une commande
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };
  
  // Mettre à jour le groupe
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du groupe est requis",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiPut(`/api/order-groups/${id}`, {
        name: groupName.trim(),
        description: groupDescription.trim(),
        orderIds: selectedOrders
      });
      
      toast({
        title: "Groupe mis à jour",
        description: `Le groupe "${groupName}" a été mis à jour avec succès.`
      });
      
      // Retourner à la page des groupes
      router.push('/order-groups');
    } catch (error) {
      console.error("Erreur lors de la mise à jour du groupe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le groupe.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Modifier le groupe</h1>
          <p className="text-muted-foreground">
            {loadingGroup ? 'Chargement...' : `Éditer le groupe "${groupName}"`}
          </p>
        </div>
        <Link href="/order-groups">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux groupes
          </Button>
        </Link>
      </div>
      
      {loadingGroup ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : groupError ? (
        <Card>
          <CardContent className="text-center py-8 text-destructive">
            Erreur lors du chargement des données du groupe
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Informations du groupe */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Informations du groupe</CardTitle>
                <CardDescription>
                  Modifiez les détails du groupe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Nom du groupe *</Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Nom du groupe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="groupDescription">Description (optionnelle)</Label>
                  <Input
                    id="groupDescription"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Description du groupe"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !groupName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Gestion des commandes */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Commandes dans ce groupe</CardTitle>
                <CardDescription>
                  Ajoutez ou retirez des commandes de ce groupe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des commandes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-8 w-8"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="border rounded-md">
                  {loadingOrders ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Chargement des commandes...
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune commande trouvée
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Sélection</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Personnage</TableHead>
                          <TableHead>Professions</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow 
                            key={order._id} 
                            className={selectedOrders.includes(order._id) ? "bg-primary/5" : ""}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedOrders.includes(order._id)}
                                onCheckedChange={() => toggleOrderSelection(order._id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{order.clientName}</TableCell>
                            <TableCell>{order.character || '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(order.professions) && order.professions.map((prof, idx) => (
                                  <span key={idx} className="bg-muted px-2 py-0.5 rounded-md text-xs">
                                    {prof.name}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(order.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 text-sm">
                  <div>
                    <span className="font-medium">{selectedOrders.length}</span> commandes sélectionnées
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedOrders([])}
                    disabled={selectedOrders.length === 0}
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
