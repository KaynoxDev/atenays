'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGet } from '@/hooks/useApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, FileText } from 'lucide-react';

export default function AdminStatsPage() {
  const { data: orders = [], loading: loadingOrders, refetch: refetchOrders } = useGet('/api/orders');
  const { data: clients = [], loading: loadingClients } = useGet('/api/clients');
  const { data: materials = [], loading: loadingMaterials } = useGet('/api/materials');
  
  const [timeFrame, setTimeFrame] = useState('all');
  const [groupBy, setGroupBy] = useState('month');

  // Préparation des données pour les graphiques avec protection contre null/undefined
  const getFilteredOrders = () => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) return [];
    
    let filtered = [...orders];
    
    if (timeFrame === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filtered = filtered.filter(order => order && order.createdAt && new Date(order.createdAt) >= oneMonthAgo);
    } else if (timeFrame === 'quarter') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      filtered = filtered.filter(order => order && order.createdAt && new Date(order.createdAt) >= threeMonthsAgo);
    } else if (timeFrame === 'year') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      filtered = filtered.filter(order => order && order.createdAt && new Date(order.createdAt) >= oneYearAgo);
    }
    
    return filtered;
  };

  // Données pour le graphique en barres des professions
  const getProfessionData = () => {
    const filteredOrders = getFilteredOrders();
    const professionCount = {};
    
    filteredOrders.forEach(order => {
      if (order && order.profession) {
        professionCount[order.profession] = (professionCount[order.profession] || 0) + 1;
      }
    });
    
    return Object.keys(professionCount).map(profession => ({
      name: profession,
      count: professionCount[profession],
    }));
  };

  // Données pour le graphique camembert des statuts
  const getStatusData = () => {
    const filteredOrders = getFilteredOrders();
    const statusCount = {
      completed: 0,
      'in-progress': 0,
      pending: 0,
      cancelled: 0
    };
    
    filteredOrders.forEach(order => {
      if (order && order.status) {
        statusCount[order.status] = (statusCount[order.status] || 0) + 1;
      }
    });
    
    return Object.keys(statusCount).map(status => ({
      name: getStatusName(status),
      value: statusCount[status],
    }));
  };

  // Données pour le graphique temporel
  const getTimeSeriesData = () => {
    const filteredOrders = getFilteredOrders();
    const timeData = {};
    
    filteredOrders.forEach(order => {
      if (!order || !order.createdAt) return;

      let timeKey;
      const date = new Date(order.createdAt);
      
      if (groupBy === 'day') {
        timeKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        timeKey = startOfWeek.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!timeData[timeKey]) {
        timeData[timeKey] = { date: timeKey, count: 0, revenue: 0 };
      }
      
      timeData[timeKey].count += 1;
      timeData[timeKey].revenue += order.price || 0;
    });
    
    return Object.values(timeData).sort((a, b) => a.date.localeCompare(b.date));
  };

  const statusColors = {
    'Terminée': '#4ade80',
    'En cours': '#fbbf24',
    'En attente': '#60a5fa',
    'Annulée': '#ef4444'
  };

  const professionColors = [
    '#2563eb', '#7c3aed', '#db2777', '#65a30d', '#ea580c', '#0891b2', '#4f46e5', '#d97706'
  ];

  function getStatusName(status) {
    const translations = {
      completed: 'Terminée',
      'in-progress': 'En cours',
      pending: 'En attente',
      cancelled: 'Annulée'
    };
    return translations[status] || status;
  }

  // Safe values for statistics
  const loading = loadingOrders || loadingClients || loadingMaterials;
  const professionData = getProfessionData();
  const statusData = getStatusData();
  const timeSeriesData = getTimeSeriesData();
  const totalOrders = Array.isArray(orders) ? orders.length : 0;
  const filteredOrdersArray = getFilteredOrders();
  const totalRevenue = Array.isArray(orders) ? 
    orders.reduce((acc, order) => acc + ((order && order.price) || 0), 0) : 0;
  const filteredRevenue = filteredOrdersArray.reduce((acc, order) => acc + ((order && order.price) || 0), 0);
  const totalClients = Array.isArray(clients) ? clients.length : 0;
  const activeClients = Array.isArray(filteredOrdersArray) ? 
    Array.from(new Set(filteredOrdersArray.filter(o => o && o.clientId).map(order => order.clientId))).length : 0;
  const inProgressOrders = Array.isArray(orders) ? 
    orders.filter(order => order && order.status === 'in-progress').length : 0;
  const pendingOrders = Array.isArray(orders) ? 
    orders.filter(order => order && order.status === 'pending').length : 0;
  const completedOrders = filteredOrdersArray.filter(o => o && o.status === 'completed').length;
  const completionRate = filteredOrdersArray.length > 0 ? 
    ((completedOrders / filteredOrdersArray.length) * 100).toFixed(0) : 0;
  const avgOrderValue = filteredOrdersArray.length > 0 ?
    (filteredRevenue / filteredOrdersArray.length).toFixed(0) : 0;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Statistiques</h1>
          <p className="text-muted-foreground">Analyse des données et métriques de performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchOrders()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingOrders ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-4 p-4 items-center">
          <div>
            <label className="text-sm font-medium block mb-1">Période</label>
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Choisir une période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les données</SelectItem>
                <SelectItem value="month">Dernier mois</SelectItem>
                <SelectItem value="quarter">Dernier trimestre</SelectItem>
                <SelectItem value="year">Dernière année</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Grouper par</label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Grouper par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Jour</SelectItem>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrdersArray.length} dans la période sélectionnée
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue} <span className="text-xs">or</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredRevenue} or dans la période
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {activeClients} actifs récemment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Commandes en Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inProgressOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders} en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="professions">Professions</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Statut</CardTitle>
                <CardDescription>Distribution des commandes selon leur état</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#8884d8'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Métiers Populaires</CardTitle>
                <CardDescription>Nombre de commandes par profession</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  {professionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={professionData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8">
                          {professionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={professionColors[index % professionColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="professions" className="pt-4">
          <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">Analyses détaillées des professions à venir...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Commandes</CardTitle>
              <CardDescription>Nombre de commandes et revenus au fil du temps</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px]">
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeSeriesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="Nombre de commandes" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="revenue" name="Revenus (or)" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible pour la période sélectionnée
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tableau récapitulatif */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapport de synthèse</CardTitle>
              <CardDescription>Un aperçu des données clés pour la période sélectionnée</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              <FileText className="h-4 w-4" /> Exporter en PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tableau récapitulatif */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Métriques générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre de commandes:</span>
                    <span className="font-medium">{filteredOrdersArray.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commandes complétées:</span>
                    <span className="font-medium">{completedOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taux de complétion:</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                </div>
                <div className="border rounded p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenus totaux:</span>
                    <span className="font-medium">{filteredRevenue} or</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenu moyen par commande:</span>
                    <span className="font-medium">{avgOrderValue} or</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clients uniques:</span>
                    <span className="font-medium">{activeClients}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
