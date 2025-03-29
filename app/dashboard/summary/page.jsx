'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, CreditCard, TrendingUp, Users, Award } from 'lucide-react';
import { useGet } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import ExportData from '@/components/ui/ExportData';

export default function DashboardSummaryPage() {
  const [timeframe, setTimeframe] = useState('all');
  const { data: orders = [], loading: loadingOrders } = useGet('/api/orders');
  const { data: clients = [], loading: loadingClients } = useGet('/api/clients');
  const { data: materials = [], loading: loadingMaterials } = useGet('/api/materials');
  
  // Fonction pour filtrer les données selon la période sélectionnée
  const getFilteredOrders = () => {
    if (!Array.isArray(orders)) return [];
    
    if (timeframe === 'all') return orders;
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return orders;
    }
    
    return orders.filter(order => new Date(order.createdAt) >= cutoffDate);
  };
  
  const filteredOrders = getFilteredOrders();
  
  // Calcul des statistiques de base
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.price || 0), 0);
  const completedOrders = filteredOrders.filter(order => order.status === 'completed').length;
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
  const activeOrders = filteredOrders.filter(order => order.status === 'in-progress').length;
  const avgOrderValue = filteredOrders.length ? Math.round(totalRevenue / filteredOrders.length) : 0;
  
  // Données pour le graphique des professions
  const professionData = () => {
    const profCounts = {};
    filteredOrders.forEach(order => {
      if (Array.isArray(order.professions) && order.professions.length > 0) {
        // Nouvelle structure avec tableau professions
        order.professions.forEach(prof => {
          if (prof.name) {
            profCounts[prof.name] = (profCounts[prof.name] || 0) + 1;
          }
        });
      } else if (order.profession) {
        // Ancienne structure avec un seul champ profession
        profCounts[order.profession] = (profCounts[order.profession] || 0) + 1;
      }
    });
    
    return Object.entries(profCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };
  
  // Données pour le graphique des statuts de commande
  const statusData = () => {
    const counts = {
      completed: completedOrders,
      'in-progress': activeOrders,
      pending: pendingOrders,
      cancelled: filteredOrders.filter(order => order.status === 'cancelled').length
    };
    
    return Object.entries(counts).map(([name, value]) => ({
      name: getStatusName(name),
      value
    }));
  };
  
  // Données pour le graphique temporel des commandes
  const timeSeriesData = () => {
    const dateMap = {};
    
    filteredOrders.forEach(order => {
      if (!order.createdAt) return;
      
      const date = new Date(order.createdAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dateMap[month]) {
        dateMap[month] = { name: month, orders: 0, revenue: 0 };
      }
      
      dateMap[month].orders += 1;
      dateMap[month].revenue += order.price || 0;
    });
    
    // Trier par date
    return Object.values(dateMap).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Données pour le graphique des clients actifs
  const clientActivityData = () => {
    const clientOrders = {};
    
    filteredOrders.forEach(order => {
      if (order.clientId) {
        clientOrders[order.clientId] = (clientOrders[order.clientId] || 0) + 1;
      }
    });
    
    // Compter combien de clients ont passé X commandes
    const orderCounts = {};
    Object.values(clientOrders).forEach(count => {
      orderCounts[count] = (orderCounts[count] || 0) + 1;
    });
    
    // Formater pour le graphique
    return Object.entries(orderCounts).map(([orders, clients]) => ({
      name: `${orders} commande${orders > 1 ? 's' : ''}`,
      value: clients
    }));
  };
  
  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#83a6ed'];
  const STATUS_COLORS = {
    'Terminée': '#22c55e',
    'En cours': '#f59e0b',
    'En attente': '#3b82f6',
    'Annulée': '#ef4444'
  };
  
  function getStatusName(status) {
    const translations = {
      completed: 'Terminée',
      'in-progress': 'En cours',
      pending: 'En attente',
      cancelled: 'Annulée'
    };
    return translations[status] || status;
  }
  
  const loading = loadingOrders || loadingClients || loadingMaterials;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Tableau de Bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de l'activité</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les données</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
              <SelectItem value="quarter">3 derniers mois</SelectItem>
              <SelectItem value="year">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          
          <ExportData 
            data={filteredOrders} 
            filename="rapport_commandes" 
            title="Exporter les données du rapport"
          />
        </div>
      </div>
      
      {/* Cartes KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <CreditCard className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
                {loading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <h3 className="text-2xl font-bold">{totalRevenue} <span className="text-xs">or</span></h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <Clock className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commandes actives</p>
                {loading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <h3 className="text-2xl font-bold">{pendingOrders + activeOrders}</h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-full">
                <Users className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                {loading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <h3 className="text-2xl font-bold">{clients.length}</h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <Award className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valeur moyenne</p>
                {loading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <h3 className="text-2xl font-bold">{avgOrderValue} <span className="text-xs">or</span></h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des commandes par statut */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des commandes</CardTitle>
            <CardDescription>Par statut</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} commandes`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              <Badge variant="outline" className="bg-green-100 text-green-800">{completedOrders} Terminées</Badge>
              <Badge variant="outline" className="bg-amber-100 text-amber-800">{activeOrders} En cours</Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">{pendingOrders} En attente</Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Graphique des commandes par profession */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes par Métier</CardTitle>
            <CardDescription>Les métiers les plus demandés</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4 h-[300px] flex flex-col justify-center">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-10 w-2/3" />
              </div>
            ) : (
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={professionData()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" name="Nombre de commandes" fill="#8884d8">
                      {professionData().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Évolution temporelle</TabsTrigger>
          <TabsTrigger value="clients">Activité des clients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des commandes et revenus</CardTitle>
              <CardDescription>Suivi mensuel des activités</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : timeSeriesData().length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="orders" name="Commandes" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenus" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Pas assez de données pour afficher le graphique</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des clients</CardTitle>
              <CardDescription>Nombre de clients par nombre de commandes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : clientActivityData().length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={clientActivityData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Nombre de clients" fill="#8884d8">
                        {clientActivityData().map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Pas assez de données pour afficher le graphique</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
