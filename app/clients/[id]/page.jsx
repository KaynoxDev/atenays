'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarClock, Edit, Mail, MessageSquare, RotateCw, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGet, apiPut, apiDelete } from '@/hooks/useApi';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Helper function to validate MongoDB ObjectId format
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data: client, loading: clientLoading, error: clientError, refetch } = 
    useGet(params.id && isValidObjectId(params.id) ? `/api/clients/${params.id}` : null, null);
  
  // Modifier ce hook pour utiliser l'endpoint spécifique des commandes par client
  const { data: clientOrders = [], loading: ordersLoading, refetch: refetchOrders } = 
    useGet(`/api/orders/client/${params.id}`, []);
  
  useEffect(() => {
    if (client) {
      setEditedClient({ ...client });
    }
  }, [client]);
  
  // Add validation before making the API request
  useEffect(() => {
    if (params.id && !isValidObjectId(params.id)) {
      toast({
        title: "ID invalide",
        description: "L'identifiant du client n'est pas au format attendu.",
        variant: "destructive"
      });
    }
  }, [params.id, toast]);
  
  // Recalculer les statistiques de commande quand les données changent
  const ordersByStatus = {
    completed: Array.isArray(clientOrders) ? clientOrders.filter(order => order.status === 'completed').length : 0,
    inProgress: Array.isArray(clientOrders) ? clientOrders.filter(order => order.status === 'in-progress').length : 0,
    pending: Array.isArray(clientOrders) ? clientOrders.filter(order => order.status === 'pending').length : 0,
    cancelled: Array.isArray(clientOrders) ? clientOrders.filter(order => order.status === 'cancelled').length : 0,
  };
  
  const totalSpent = Array.isArray(clientOrders) ? clientOrders.reduce((sum, order) => {
    if (order.status === 'completed') {
      return sum + (Number(order.price) || 0);
    }
    return sum;
  }, 0) : 0;
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClient(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSave = async () => {
    try {
      // Créer une copie des données du client sans l'_id
      const clientToUpdate = { ...editedClient };
      if (clientToUpdate._id) {
        delete clientToUpdate._id;
      }
      
      await apiPut(`/api/clients/${params.id}`, clientToUpdate);
      setIsEditing(false);
      refetch();
      toast.success({
        title: "Client modifié",
        description: "Les informations du client ont été mises à jour avec succès."
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour du client:", err);
      toast.error({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour les informations du client."
      });
    }
  };
  
  const handleDelete = async () => {
    try {
      await apiDelete(`/api/clients/${params.id}`);
      toast.success({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès."
      });
      router.push('/clients');
    } catch (err) {
      console.error("Erreur lors de la suppression du client:", err);
      toast.error({
        title: "Erreur de suppression",
        description: "Impossible de supprimer le client."
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Fonction de rafraichissement pour actualiser les commandes et le client
  const refreshAll = () => {
    refetch();
    refetchOrders();
  };
  
  if (clientLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (clientError || !client) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>Impossible de charger les détails du client</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Le client demandé n'a pas été trouvé ou une erreur s'est produite.</p>
            {clientError && (
              <div className="mt-2 p-2 bg-destructive/10 rounded-md text-destructive">
                {clientError.message || "Erreur inconnue"}
              </div>
            )}
            <Button className="mt-4" onClick={() => router.push('/clients')}>
              Retour à la liste des clients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">{client.name}</h1>
          <p className="text-muted-foreground">Royaume: {client.realm || 'Non spécifié'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>Discord: {client.discord || 'Non spécifié'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span>Client depuis: {new Date(client.joinedDate || Date.now()).toLocaleDateString()}</span>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Commandes</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{clientOrders.length} totales</Badge>
                  <Badge variant="outline" className="bg-green-100">{ordersByStatus.completed} terminées</Badge>
                  <Badge variant="outline" className="bg-amber-100">{ordersByStatus.inProgress} en cours</Badge>
                  <Badge variant="outline" className="bg-blue-100">{ordersByStatus.pending} en attente</Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Total dépensé</h3>
                <div className="text-2xl font-bold">{totalSpent} <span className="text-xs">or</span></div>
              </div>
              
              {client.notes && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Notes
                  </h3>
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={refreshAll}>
                <RotateCw className="h-4 w-4 mr-2" />
                Actualiser les données
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Commandes du client</CardTitle>
                  <CardDescription>
                    Liste des commandes passées ou en cours pour {client.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : clientOrders.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      Aucune commande trouvée pour ce client
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Profession</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Prix</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientOrders.map((order) => (
                          <TableRow key={order._id}>
                            <TableCell>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {Array.isArray(order.professions) && order.professions.length > 0
                                ? order.professions.map(p => p.name).join(', ')
                                : order.profession || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'in-progress' ? 'bg-amber-100 text-amber-800' :
                                order.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {getStatusName(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {order.price} or
                            </TableCell>
                            <TableCell>
                              <Link href={`/orders/${order._id}`}>
                                <Button variant="outline" size="sm">
                                  Voir
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  
                  <div className="mt-6 flex justify-center">
                    <Link href={`/orders/new?clientId=${client._id}`}>
                      <Button>Nouvelle commande</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Historique du client</CardTitle>
                  <CardDescription>
                    Activité et interactions avec {client.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-muted-foreground">
                    Fonctionnalité à venir...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Modal d'édition */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>
              Modifiez les informations du client. Cliquez sur Enregistrer une fois terminé.
            </DialogDescription>
          </DialogHeader>
          
          {editedClient && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={editedClient.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="realm" className="text-right">
                  Royaume
                </Label>
                <Input
                  id="realm"
                  name="realm"
                  value={editedClient.realm || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discord" className="text-right">
                  Discord
                </Label>
                <Input
                  id="discord"
                  name="discord"
                  value={editedClient.discord || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="character" className="text-right">
                  Personnage
                </Label>
                <Input
                  id="character"
                  name="character"
                  value={editedClient.character || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={editedClient.notes || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.</p>
            <p className="mt-2 font-medium">Attention : Toutes les commandes associées à ce client resteront dans le système mais ne seront plus liées à un client.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Fonction d'aide pour obtenir le nom traduit du statut
function getStatusName(status) {
  const translations = {
    'completed': 'Terminée',
    'in-progress': 'En cours',
    'pending': 'En attente',
    'cancelled': 'Annulée'
  };
  return translations[status] || status;
}
