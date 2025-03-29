'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, CalendarDays, Coins, PackageOpen, PieChart, ShoppingBag, Users } from 'lucide-react';
import MaterialCalculator from '@/components/ui/MaterialCalculator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useGet } from '@/hooks/useApi';

export default function Dashboard() {
  const [selectedProfession, setSelectedProfession] = useState('Blacksmithing');
  const [showMaterials, setShowMaterials] = useState(false);
  
  // Charger les données de façon optimisée
  const { data: orders = [] } = useGet('/api/orders', []);
  const { data: clients = [] } = useGet('/api/clients', []);
  
  // Afficher le calculateur de matériaux seulement après un délai pour éviter les requêtes inutiles
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMaterials(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Calculer les statistiques basées sur les données réelles
  const totalClients = clients.length || 0;
  const activeOrders = orders.filter(o => o?.status === 'in-progress').length || 0;
  const pendingOrders = orders.filter(o => o?.status === 'pending').length || 0;
  const completedThisMonth = (() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return orders.filter(o => 
      o?.status === 'completed' && 
      o?.completedAt && 
      new Date(o.completedAt) >= oneMonthAgo
    ).length;
  })() || 0;
  const revenue = orders.reduce((sum, o) => sum + (o?.price || 0), 0);

  // Calcul des performances par profession
  const topProfessions = useMemo(() => {
    const professionStats = {};
    
    orders.forEach(order => {
      if (!order?.profession) return;
      
      if (!professionStats[order.profession]) {
        professionStats[order.profession] = {
          name: order.profession,
          revenue: 0,
          orders: 0
        };
      }
      
      professionStats[order.profession].revenue += order.price || 0;
      professionStats[order.profession].orders += 1;
    });
    
    return Object.values(professionStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  // Commandes récentes
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .map(order => ({
        id: order._id,
        client: order.clientName,
        profession: order.profession,
        price: order.price,
        status: order.status,
        date: order.createdAt
      }));
  }, [orders]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Tableau de bord</h1>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Base de clients actifs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commandes Actives</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders} en attente de traitement
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Complétés ce mois</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Sur les 30 derniers jours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenue} <span className="text-xs">or</span></div>
            <p className="text-xs text-muted-foreground">
              Tous services confondus
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Professional Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance des Métiers</CardTitle>
            <CardDescription>
              Les métiers les plus performants par nombre de commandes et revenus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topProfessions.length > 0 ? (
                topProfessions.map((profession, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{getProfessionEmoji(profession.name)}</span>
                        <span>{profession.name}</span>
                      </div>
                      <span className="font-medium">{profession.revenue} or</span>
                    </div>
                    <Progress value={(profession.revenue / Math.max(...topProfessions.map(p => p.revenue))) * 100} className="h-2" 
                      style={{ 
                        background: 'rgba(203, 213, 225, 0.2)',
                        '--tw-progress-fill': getProfessionColor(profession.name)
                      }} 
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{profession.orders} commandes</span>
                      <span>{Math.round((profession.revenue / revenue) * 100)}% du revenu total</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Aucune donnée de performance disponible
                </div>
              )}
            </div>
            <div className="flex justify-center mt-6">
              <Link href="/admin/stats">
                <Button variant="outline">Voir les statistiques détaillées</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes Récentes</CardTitle>
            <CardDescription>
              Dernières commandes de services des clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, i) => (
                  <div key={i} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{order.client}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <span className="mr-1">{getProfessionEmoji(order.profession)}</span>
                          {order.profession}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{order.price} or</div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block
                          ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            order.status === 'in-progress' ? 'bg-amber-100 text-amber-800' : 
                            'bg-blue-100 text-blue-800'}` 
                        }>
                          {order.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.date ? new Date(order.date).toLocaleDateString() : 'Date inconnue'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Aucune commande récente
                </div>
              )}
            </div>
            <div className="flex justify-center mt-6">
              <Link href="/orders">
                <Button variant="outline">Voir toutes les commandes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Material Calculator Section - Chargé conditionnellement */}
      {showMaterials && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <CardTitle>Calculateur de Matériaux</CardTitle>
                  <CardDescription>
                    Calcule les matériaux nécessaires pour monter en compétence
                  </CardDescription>
                </div>
                <Select 
                  value={selectedProfession}
                  onValueChange={setSelectedProfession}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select profession" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blacksmithing">Forge</SelectItem>
                    <SelectItem value="Tailoring">Couture</SelectItem>
                    <SelectItem value="Leatherworking">Travail du cuir</SelectItem>
                    <SelectItem value="Engineering">Ingénierie</SelectItem>
                    <SelectItem value="Alchemy">Alchimie</SelectItem>
                    <SelectItem value="Enchanting">Enchantement</SelectItem>
                    <SelectItem value="Jewelcrafting">Joaillerie</SelectItem>
                    <SelectItem value="Inscription">Calligraphie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <MaterialCalculator professionName={selectedProfession} levelRange="525" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function getProfessionEmoji(profession) {
  const icons = {
    'Forge': '🔨',
    'Blacksmithing': '🔨',
    'Couture': '🧵',
    'Tailoring': '🧵',
    'Travail du cuir': '🧶',
    'Leatherworking': '🧶',
    'Ingénierie': '⚙️',
    'Engineering': '⚙️',
    'Alchimie': '⚗️',
    'Alchemy': '⚗️',
    'Enchantement': '✨',
    'Enchanting': '✨',
    'Joaillerie': '💎',
    'Jewelcrafting': '💎',
    'Calligraphie': '📜',
    'Inscription': '📜',
  };
  return icons[profession] || '📋';
}

function getProfessionColor(profession) {
  const colors = {
    'Forge': 'rgb(234, 88, 12)',
    'Blacksmithing': 'rgb(234, 88, 12)',
    'Couture': 'rgb(79, 70, 229)',
    'Tailoring': 'rgb(79, 70, 229)',
    'Ingénierie': 'rgb(217, 119, 6)',
    'Engineering': 'rgb(217, 119, 6)',
    'Alchimie': 'rgb(5, 150, 105)',
    'Alchemy': 'rgb(5, 150, 105)',
    'Enchantement': 'rgb(147, 51, 234)',
    'Enchanting': 'rgb(147, 51, 234)',
    'Joaillerie': 'rgb(59, 130, 246)',
    'Jewelcrafting': 'rgb(59, 130, 246)',
    'Calligraphie': 'rgb(79, 70, 229)',
    'Inscription': 'rgb(79, 70, 229)',
    'Travail du cuir': 'rgb(180, 83, 9)',
    'Leatherworking': 'rgb(180, 83, 9)',
  };
  return colors[profession] || '#888888';
}
