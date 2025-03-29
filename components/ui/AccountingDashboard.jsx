'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  BarChart2, 
  FileText,
  PlusCircle,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function AccountingDashboard({ 
  stats = { 
    revenue: 0, 
    pendingAmount: 0, 
    completedOrders: 0, 
    activeOrders: 0,
    clientCount: 0
  }, 
  recentOrders = [], 
  recentClients = [], 
  loading = false 
}) {
  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Revenus</CardTitle>
            <CardDescription>Vue d'ensemble des revenus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Total encaissé
                </div>
                <div className="text-3xl font-bold">
                  {stats.revenue} <span className="text-sm font-normal text-muted-foreground">or</span>
                </div>
                <div className="mt-2 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">+12% depuis le mois dernier</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Montant en attente
                </div>
                <div className="text-3xl font-bold">
                  {stats.pendingAmount} <span className="text-sm font-normal text-muted-foreground">or</span>
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {stats.activeOrders} commandes actives
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="h-[90px] mt-4 border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold">{stats.completedOrders}</div>
                  <div className="text-xs text-muted-foreground">Commandes terminées</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{stats.activeOrders}</div>
                  <div className="text-xs text-muted-foreground">Commandes actives</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{stats.clientCount}</div>
                  <div className="text-xs text-muted-foreground">Clients</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Calendar & Tasks */}
        <Card className="md:row-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">À faire aujourd'hui</CardTitle>
            <CardDescription>Commandes prioritaires</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.slice(0, 3).map((order, index) => (
              <div key={order.id || index} className="flex items-start space-x-3">
                <div className="p-1 bg-blue-100 rounded-full text-blue-700">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{order.clientName || "Client"} - {order.professions?.[0]?.name || order.profession || "Commande"}</p>
                  <p className="text-xs text-muted-foreground">Échéance: {new Date(order.deadline || Date.now()).toLocaleDateString()}</p>
                </div>
                <Badge variant={
                  order.status === 'completed' ? 'success' :
                  order.status === 'in-progress' ? 'warning' :
                  order.status === 'pending' ? 'info' : 'secondary'
                }>
                  {order.status === 'completed' ? 'Terminée' :
                   order.status === 'in-progress' ? 'En cours' :
                   order.status === 'pending' ? 'En attente' : 
                   'N/A'}
                </Badge>
              </div>
            ))}
            
            <Button variant="outline" className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Commandes récentes</CardTitle>
              <CardDescription>Aperçu des dernières commandes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              Tout voir <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order, index) => (
                <TableRow key={order.id || index}>
                  <TableCell className="font-medium">{order.clientName}</TableCell>
                  <TableCell>{order.professions?.[0]?.name || order.profession || "Service"}</TableCell>
                  <TableCell>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      order.status === 'completed' ? 'success' :
                      order.status === 'in-progress' ? 'warning' :
                      order.status === 'pending' ? 'info' : 'secondary'
                    }>
                      {order.status === 'completed' ? 'Terminée' :
                       order.status === 'in-progress' ? 'En cours' :
                       order.status === 'pending' ? 'En attente' : 
                       'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{order.price} or</TableCell>
                </TableRow>
              ))}
              {recentOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Aucune commande récente
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
