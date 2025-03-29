'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Edit, Trash2, FileEdit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGet, apiDelete } from '@/hooks/useApi';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ClientsPage() {
  const { data: clients = [], loading: loadingClients, refetch: refetchClients } = useGet('/api/clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [clientsWithOrders, setClientsWithOrders] = useState({});
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { toast, success } = useToast();
  
  // Filtrer les clients en fonction du terme de recherche
  // Protection contre clients null
  const filteredClients = Array.isArray(clients) 
    ? clients.filter(client => 
        client && (
          (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
          (client.realm && client.realm.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (client.discord && client.discord.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
    : [];
  
  // Charger les commandes pour chaque client
  useEffect(() => {
    if (!Array.isArray(clients) || clients.length === 0) {
      setLoadingOrders(false);
      return;
    }
    
    const fetchOrdersForClients = async () => {
      setLoadingOrders(true);
      const ordersData = {};
      
      try {
        // Récupérer les commandes pour chaque client en parallèle
        await Promise.all(clients.map(async (client) => {
          if (!client || !client._id) return;
          
          try {
            const response = await fetch(`/api/orders/client/${client._id}`);
            if (!response.ok) throw new Error(`Failed to fetch orders for client ${client._id}`);
            
            const orders = await response.json();
            if (Array.isArray(orders)) {
              // Calculer les statistiques
              ordersData[client._id] = {
                totalOrders: orders.length,
                completedOrders: orders.filter(o => o && o.status === 'completed').length,
                pendingOrders: orders.filter(o => o && o.status === 'pending').length,
                inProgressOrders: orders.filter(o => o && o.status === 'in-progress').length
              };
            } else {
              // Si orders n'est pas un tableau, initialiser avec des valeurs par défaut
              ordersData[client._id] = {
                totalOrders: 0,
                completedOrders: 0,
                pendingOrders: 0,
                inProgressOrders: 0,
                error: true
              };
            }
          } catch (error) {
            console.error(`Error fetching orders for client ${client._id}:`, error);
            ordersData[client._id] = { 
              totalOrders: 0,
              completedOrders: 0,
              pendingOrders: 0,
              inProgressOrders: 0,
              error: true 
            };
          }
        }));
        
        setClientsWithOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders for clients:", error);
      } finally {
        setLoadingOrders(false);
      }
    };
    
    fetchOrdersForClients();
  }, [clients]);

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    
    try {
      await apiDelete(`/api/clients/${clientToDelete._id}`);
      refetchClients();
      success({
        title: "Client supprimé",
        description: `${clientToDelete.name} a été supprimé avec succès.`
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client.",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Clients</h1>
          <p className="text-muted-foreground">Gérez vos clients et leurs commandes</p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Client
          </Button>
        </Link>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, royaume ou discord..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>
            {Array.isArray(clients) ? clients.length : 0} clients enregistrés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Royaume</TableHead>
                <TableHead>Discord</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map(client => (
                <TableRow key={client._id}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                  </TableCell>
                  <TableCell>{client.realm || '-'}</TableCell>
                  <TableCell>{client.discord || '-'}</TableCell>
                  <TableCell>
                    {loadingOrders || !clientsWithOrders[client._id] ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        <span className="text-xs text-muted-foreground">Chargement...</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {clientsWithOrders[client._id].totalOrders || 0} total
                        </Badge>
                        {(clientsWithOrders[client._id].completedOrders > 0) && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                            {clientsWithOrders[client._id].completedOrders} terminées
                          </Badge>
                        )}
                        {(clientsWithOrders[client._id].pendingOrders > 0) && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                            {clientsWithOrders[client._id].pendingOrders} en attente
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/clients/${client._id}`}>
                          <DropdownMenuItem>
                            <FileEdit className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/orders/new?clientId=${client._id}`}>
                          <DropdownMenuItem>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle commande
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => handleDeleteClick(client)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {loadingClients 
                      ? "Chargement des clients..." 
                      : searchTerm
                        ? "Aucun client ne correspond à votre recherche"
                        : "Aucun client enregistré"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Dialog de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          
          {clientToDelete && (
            <div className="py-4">
              <div className="space-y-2">
                <div>
                  <Label className="font-medium">Nom</Label>
                  <p>{clientToDelete.name}</p>
                </div>
                {clientToDelete.realm && (
                  <div>
                    <Label className="font-medium">Royaume</Label>
                    <p>{clientToDelete.realm}</p>
                  </div>
                )}
                {clientToDelete.discord && (
                  <div>
                    <Label className="font-medium">Discord</Label>
                    <p>{clientToDelete.discord}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-destructive font-medium">
                  Attention : Les commandes associées à ce client seront conservées mais ne seront plus liées à aucun client.
                </p>
              </div>
            </div>
          )}
          
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
