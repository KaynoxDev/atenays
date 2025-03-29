'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGet } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, PlusCircle, Trash2, RotateCw, Check, Clock, 
  HelpCircle, Loader2, List, Grid2X2, Ellipsis
} from 'lucide-react';
import Link from 'next/link';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OrdersPage() {
  const { data: orders = [], loading, refetch } = useGet('/api/orders', []);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('newest');
  
  // Fonction pour obtenir les commandes filtrées selon le statut et la recherche
  const getFilteredOrders = () => {
    return orders.filter(order => {
      // Filtrage par statut
      if (selectedTab !== 'all' && order.status !== selectedTab) {
        return false;
      }
      
      // Filtrage par texte de recherche
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          (order.clientName && order.clientName.toLowerCase().includes(searchLower)) ||
          (order.profession && order.profession.toLowerCase().includes(searchLower)) ||
          (order.character && order.character.toLowerCase().includes(searchLower)) ||
          (order.notes && order.notes.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  };
  
  // Trier les commandes
  const getSortedOrders = (filteredOrders) => {
    switch (sortBy) {
      case 'newest':
        return [...filteredOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return [...filteredOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'price-high':
        return [...filteredOrders].sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'price-low':
        return [...filteredOrders].sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'client':
        return [...filteredOrders].sort((a, b) => a.clientName?.localeCompare(b.clientName || ''));
      default:
        return filteredOrders;
    }
  };

  const filteredOrders = getFilteredOrders();
  const sortedOrders = getSortedOrders(filteredOrders);

  // Calculer les compteurs pour chaque onglet
  const allOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(order => order.status === 'pending').length;
  const inProgressOrdersCount = orders.filter(order => order.status === 'in-progress').length;
  const completedOrdersCount = orders.filter(order => order.status === 'completed').length;
  const cancelledOrdersCount = orders.filter(order => order.status === 'cancelled').length;

  const getStatusBadge = (status) => {
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
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Commandes</h1>
          <p className="text-muted-foreground">Gérez toutes vos commandes de service</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={loading}>
            <RotateCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/orders/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouvelle Commande
            </Button>
          </Link>
        </div>
      </div>

      <Tabs 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="mb-6"
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">
              Toutes ({allOrdersCount})
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente ({pendingOrdersCount})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              En cours ({inProgressOrdersCount})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Terminées ({completedOrdersCount})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Annulées ({cancelledOrdersCount})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="flex border rounded-md">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Tabs>
      
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-8"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Les plus récentes</SelectItem>
              <SelectItem value="oldest">Les plus anciennes</SelectItem>
              <SelectItem value="price-high">Prix (décroissant)</SelectItem>
              <SelectItem value="price-low">Prix (croissant)</SelectItem>
              <SelectItem value="client">Par client</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : sortedOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <HelpCircle className="h-8 w-8 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="text-xl font-medium">Aucune commande trouvée</h3>
                <p className="text-muted-foreground">
                  {searchText ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer une nouvelle commande'}
                </p>
              </div>
              {!searchText && (
                <Link href="/orders/new">
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Créer une commande
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {sortedOrders.map(order => (
                <Link href={`/orders/${order._id}`} key={order._id}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                      <div className="font-medium">
                        {order.clientName}
                        <span className="text-muted-foreground ml-2 text-sm">{order.character}</span>
                      </div>
                      
                      <div className="mt-1 md:mt-0 flex items-center">
                        {getStatusBadge(order.status)}
                        {order.status === 'in-progress' && (
                          <div className="ml-2 bg-amber-50 text-amber-800 text-xs rounded-md px-1.5 py-0.5 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            En cours
                          </div>
                        )}
                        {order.status === 'completed' && (
                          <div className="ml-2 bg-green-50 text-green-800 text-xs rounded-md px-1.5 py-0.5 flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Terminée
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 md:mt-0">
                      {/* Info sur la profession */}
                      <div className="text-sm text-muted-foreground">
                        {order.profession || (order.professions && order.professions.length > 0 && order.professions[0].name)}
                      </div>
                      
                      {/* Date */}
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      
                      {/* Prix */}
                      <div className="font-medium">
                        {order.price} or
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/orders/${order._id}`}>
                              Voir les détails
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t">
            <div className="text-sm text-muted-foreground">
              {sortedOrders.length} commandes affichées
            </div>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedOrders.map(order => (
            <Link href={`/orders/${order._id}`} key={order._id}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{order.clientName}</CardTitle>
                      <CardDescription>
                        {order.character || "Aucun personnage"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">
                        {order.profession || (order.professions && order.professions.length > 0 && order.professions[0].name)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {order.notes || "Aucune note"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t flex justify-between">
                  <span className="text-sm text-muted-foreground">Prix:</span>
                  <span className="font-bold">{order.price} or</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
