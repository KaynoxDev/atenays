'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGet } from '@/hooks/useApi';
import { 
  Settings, Database, Package, Users, ShoppingBag, BarChart3, 
  FileText, RefreshCw, Calendar, TrendingUp, Activity
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function AdminPage() {
  const { data: orders = [], loading: loadingOrders } = useGet('/api/orders');
  const { data: clients = [], loading: loadingClients } = useGet('/api/clients');
  const { data: materials = [], loading: loadingMaterials } = useGet('/api/materials');
  
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    completedOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    completionRate: 0,
    recentClients: 0,
    topProfessions: []
  });
  
  // Calculer les statistiques lorsque les données sont chargées
  useEffect(() => {
    if (Array.isArray(orders) && orders.length > 0) {
      const totalRevenue = orders.reduce((sum, order) => sum + (order?.price || 0), 0);
      const completedOrders = orders.filter(order => order?.status === 'completed').length;
      const pendingOrders = orders.filter(order => order?.status === 'pending').length;
      const activeOrders = orders.filter(order => order?.status === 'in-progress').length;
      const completionRate = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0;
      
      // Calculer les professions les plus populaires
      const professionCounts = {};
      orders.forEach(order => {
        if (order?.profession) {
          professionCounts[order.profession] = (professionCounts[order.profession] || 0) + 1;
        }
      });
      
      const topProfessions = Object.entries(professionCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Nombre de clients récents (30 derniers jours)
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      
      const recentClients = Array.isArray(clients) ? 
        clients.filter(client => new Date(client.joinedDate || 0) >= oneMonthAgo).length : 0;
      
      setStatistics({
        totalRevenue,
        completedOrders,
        pendingOrders,
        activeOrders,
        completionRate,
        recentClients,
        topProfessions
      });
    }
  }, [orders, clients]);
  
  const adminModules = [
    {
      title: 'Gestion des Matériaux',
      description: 'Ajouter ou modifier les matériaux requis pour chaque métier',
      icon: <Package className="h-8 w-8 text-primary mb-4" />,
      link: '/admin/materials',
    },
    {
      title: 'Statistiques',
      description: 'Visualiser les analytics et métriques de performance',
      icon: <BarChart3 className="h-8 w-8 text-primary mb-4" />,
      link: '/admin/stats',
    },
    {
      title: 'Base de Données',
      description: 'Visualiser et gérer directement la base de données MongoDB',
      icon: <Database className="h-8 w-8 text-primary mb-4" />,
      link: '/admin/database',
    },
    {
      title: 'Paramètres',
      description: 'Configurer l\'application et les paramètres globaux',
      icon: <Settings className="h-8 w-8 text-primary mb-4" />,
      link: '/admin/settings',
    },
  ];

  const dataModules = [
    {
      title: 'Clients',
      count: Array.isArray(clients) ? clients.length : 0,
      icon: <Users className="h-6 w-6 text-blue-500" />,
      link: '/clients',
    },
    {
      title: 'Commandes',
      count: Array.isArray(orders) ? orders.length : 0,
      icon: <ShoppingBag className="h-6 w-6 text-amber-500" />,
      link: '/orders',
    },
    {
      title: 'Revenus',
      count: `${statistics.totalRevenue} or`,
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      link: '/admin/stats',
    },
    {
      title: 'Matériaux',
      count: Array.isArray(materials) ? materials.length : 0,
      icon: <Package className="h-6 w-6 text-purple-500" />,
      link: '/materials',
    },
  ];

  const loading = loadingOrders || loadingClients || loadingMaterials;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Administration</h1>
          <p className="text-muted-foreground">Gérez les données et paramètres d'Aténays</p>
        </div>
        <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Vue d'ensemble */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Vue d'ensemble des données</CardTitle>
          <CardDescription>Résumé des informations disponibles dans la base de données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {dataModules.map((module) => (
              <Link href={module.link} key={module.title}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/20 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-muted rounded-md">
                        {module.icon}
                      </div>
                      <div className="text-2xl font-bold">{module.count}</div>
                    </div>
                    <h3 className="font-medium">{module.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques récentes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Statistiques Récentes</CardTitle>
          <CardDescription>Aperçu des performances et activités du dernier mois</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Taux de complétion</span>
                  <span className="font-medium">{statistics.completionRate}%</span>
                </div>
                <Progress value={statistics.completionRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span>Clients actifs</span>
                  <span className="font-medium">{statistics.recentClients} / {Array.isArray(clients) ? clients.length : 0}</span>
                </div>
                <Progress value={(statistics.recentClients / Math.max(1, Array.isArray(clients) ? clients.length : 0)) * 100} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Commandes récentes</span>
                  <span className="font-medium">{statistics.pendingOrders + statistics.activeOrders} en attente</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-20">En attente</span>
                  <div className="flex-1 bg-blue-100 h-4 rounded">
                    <div 
                      className="bg-blue-500 h-full rounded" 
                      style={{ width: `${(statistics.pendingOrders / Math.max(1, statistics.pendingOrders + statistics.activeOrders)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs w-20">En cours</span>
                  <div className="flex-1 bg-amber-100 h-4 rounded">
                    <div 
                      className="bg-amber-500 h-full rounded" 
                      style={{ width: `${(statistics.activeOrders / Math.max(1, statistics.pendingOrders + statistics.activeOrders)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Commandes par Métier</h3>
              <div className="space-y-3">
                {statistics.topProfessions.map((profession, index) => (
                  <div key={profession.name}>
                    <div className="flex justify-between mb-1">
                      <span>{profession.name}</span>
                      <span className="font-medium">{profession.count} commandes</span>
                    </div>
                    <Progress 
                      value={(profession.count / Math.max(1, statistics.topProfessions[0]?.count || 1)) * 100} 
                      className="h-2"
                      // Utiliser des couleurs différentes pour les barres
                      style={{
                        '--tw-progress-fill': ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5],
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules d'administration */}
      <h2 className="text-xl font-bold mb-4">Modules d'Administration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminModules.map((module) => (
          <Card key={module.title} className={`${module.soon ? 'opacity-70' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-center h-8 w-8 text-primary mb-2">
                {module.icon}
              </div>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              {module.soon ? (
                <div className="w-full flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bientôt disponible</span>
                  <Button variant="outline" disabled>
                    À venir
                  </Button>
                </div>
              ) : (
                <Link href={module.link} className="w-full">
                  <Button className="w-full">Accéder</Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
