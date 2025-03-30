'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useGet, apiDelete } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { FilePlus, Search, RefreshCw, ArrowUpDown, Filter, Trash2, AlertCircle, Layers } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function OrdersPage() {
  // Add timeout and error handling for API calls
  const { data: orders = [], loading, error, refetch } = useGet('/api/orders', [], { timeout: 10000 });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const { toast } = useToast();
  
  // État pour la sélection multiple
  const [selectedOrders, setSelectedOrders] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Manual loading control to prevent infinite loading
  const [forceReload, setForceReload] = useState(false);

  useEffect(() => {
    // Ensure orders is an array to prevent filtering errors
    const ordersArray = Array.isArray(orders) ? orders : [];
    
    console.log("Orders loaded:", ordersArray.length);
    
    // Filter orders based on search term and active tab
    let result = ordersArray;
    
    // Apply search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(order => {
        return (
          (order.clientName && order.clientName.toLowerCase().includes(searchLower)) ||
          (order.clientRealm && order.clientRealm.toLowerCase().includes(searchLower)) ||
          (order.character && order.character.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Apply tab filtering
    if (activeTab !== 'all') {
      result = result.filter(order => order.status === activeTab);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;
        
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (sortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }
    
    setFilteredOrders(result);
  }, [orders, searchTerm, activeTab, sortConfig]);

  // Handle sorting when column header is clicked
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };
  
  // Override refetch to clear any potential stuck state
  const handleRefresh = () => {
    setForceReload(true);
    setTimeout(() => {
      refetch();
      setForceReload(false);
    }, 100);
  };
  
  // Calculer si des commandes sont sélectionnées
  const selectedCount = Object.values(selectedOrders).filter(Boolean).length;
  const allSelected = filteredOrders.length > 0 && selectedCount === filteredOrders.length;

  // Sélectionner/désélectionner toutes les commandes
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders({});
    } else {
      const newSelected = {};
      filteredOrders.forEach(order => {
        newSelected[order._id] = true;
      });
      setSelectedOrders(newSelected);
    }
  };

  // Sélectionner/désélectionner une commande
  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Supprimer les commandes sélectionnées
  const deleteSelectedOrders = async () => {
    try {
      const idsToDelete = Object.keys(selectedOrders).filter(id => selectedOrders[id]);
      
      // Vérifier qu'il y a des commandes à supprimer
      if (idsToDelete.length === 0) {
        toast({
          title: "Aucune commande sélectionnée",
          description: "Veuillez sélectionner au moins une commande à supprimer.",
          variant: "destructive"
        });
        return;
      }
      
      // Supprimer les commandes une par une
      const promises = idsToDelete.map(id => apiDelete(`/api/orders/${id}`));
      await Promise.all(promises);
      
      toast({
        title: "Commandes supprimées",
        description: `${idsToDelete.length} commande(s) supprimée(s) avec succès.`
      });
      
      // Réinitialiser la sélection et rafraîchir les données
      setSelectedOrders({});
      handleRefresh();  // Use the improved refresh handler
      setIsDeleteDialogOpen(false);
      
    } catch (error) {
      console.error("Erreur lors de la suppression des commandes:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression des commandes.",
        variant: "destructive"
      });
    }
  };

  // Function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return format(date, 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return 'Date invalide';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Commandes</h1>
          <p className="text-muted-foreground">
            Gérez les commandes et leurs statuts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading || forceReload}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || forceReload) ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/order-groups">
            <Button variant="outline">
              <Layers className="h-4 w-4 mr-2" />
              Groupes
            </Button>
          </Link>
          <Link href="/orders/new">
            <Button>
              <FilePlus className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Liste des commandes</CardTitle>
              <CardDescription>
                {loading ? 'Chargement des commandes...' : `${filteredOrders.length} commandes trouvées`}
              </CardDescription>
            </div>
            
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8 w-full sm:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="in-progress">En cours</TabsTrigger>
              <TabsTrigger value="completed">Terminées</TabsTrigger>
              <TabsTrigger value="cancelled">Annulées</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent>
            {selectedCount > 0 && (
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg mb-4">
                <span className="text-sm font-medium">{selectedCount} commande(s) sélectionnée(s)</span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer la sélection
                </Button>
              </div>
            )}
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={allSelected} 
                        onCheckedChange={toggleSelectAll}
                        aria-label="Sélectionner toutes les commandes"
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('clientName')}>
                      <div className="flex items-center">
                        Client
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('price')}>
                      <div className="flex items-center justify-end">
                        Montant
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(loading || forceReload) ? (
                    <TableRow>
                      <TableCell colSpan="7" className="text-center py-10">
                        <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Chargement des commandes...</p>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan="7" className="text-center py-10">
                        <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
                        <p className="mt-2 text-sm text-destructive">
                          Erreur lors du chargement des commandes: {error.message || "Erreur inconnue"}
                        </p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Réessayer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="7" className="text-center py-10">
                        <p className="text-muted-foreground">Aucune commande trouvée</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(order => (
                      <TableRow key={order._id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={!!selectedOrders[order._id]} 
                            onCheckedChange={() => toggleSelectOrder(order._id)}
                            aria-label={`Sélectionner la commande de ${order.clientName}`}
                          />
                        </TableCell>
                        <TableCell onClick={() => window.location.href = `/orders/${order._id}`}>
                          <div className="font-medium">{order.clientName || 'Client inconnu'}</div>
                          <div className="text-xs text-muted-foreground">{order.clientRealm || 'Royaume non spécifié'}</div>
                        </TableCell>
                        <TableCell onClick={() => window.location.href = `/orders/${order._id}`}>
                          {order.professions && order.professions.length ? (
                            <>
                              <div>{order.professions[0].name}</div>
                              {order.professions.length > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  + {order.professions.length - 1} autre(s)
                                </span>
                              )}
                            </>
                          ) : (
                            order.profession || 'Service non spécifié'
                          )}
                        </TableCell>
                        <TableCell onClick={() => window.location.href = `/orders/${order._id}`}>
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell onClick={() => window.location.href = `/orders/${order._id}`}>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right" onClick={() => window.location.href = `/orders/${order._id}`}>
                          {order.price || 0} or
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Tabs>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedCount} commande(s) ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={deleteSelectedOrders}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant pour afficher le statut de commande
function OrderStatusBadge({ status }) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">En attente</Badge>;
    case 'in-progress':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700">En cours</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-50 text-green-700">Terminée</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-50 text-red-700">Annulée</Badge>;
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
}
