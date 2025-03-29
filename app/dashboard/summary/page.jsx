'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGet } from '@/hooks/useApi';
import AccountingDashboard from '@/components/ui/AccountingDashboard';

export default function DashboardSummaryPage() {
  const [stats, setStats] = useState({
    revenue: 0,
    pendingAmount: 0,
    completedOrders: 0,
    activeOrders: 0,
    clientCount: 0
  });
  
  const { data: orders = [], loading: loadingOrders } = useGet('/api/orders');
  const { data: clients = [], loading: loadingClients } = useGet('/api/clients');
  
  useEffect(() => {
    if (!loadingOrders && Array.isArray(orders) && !loadingClients && Array.isArray(clients)) {
      // Calculate stats only when both orders and clients are loaded and are arrays
      const completedOrders = orders.filter(order => order.status === 'completed');
      const activeOrders = orders.filter(order => order.status !== 'completed');
      
      const revenue = completedOrders.reduce((sum, order) => sum + (order.price || 0), 0);
      const pendingAmount = activeOrders.reduce((sum, order) => sum + (order.price || 0), 0);
      
      setStats({
        revenue,
        pendingAmount,
        completedOrders: completedOrders.length,
        activeOrders: activeOrders.length,
        clientCount: clients.length
      });
    }
  }, [orders, clients, loadingOrders, loadingClients]);
  
  // Get recent orders, safely handling empty or null arrays
  const recentOrders = Array.isArray(orders) 
    ? orders.slice(0, 5).map(order => ({
        ...order,
        clientName: order.clientName || 'Client'
      }))
    : [];
  
  // Get recent clients, safely handling empty or null arrays
  const recentClients = Array.isArray(clients) 
    ? clients.slice(0, 3)
    : [];
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Tableau de bord</h1>
      
      <AccountingDashboard 
        stats={stats}
        recentOrders={recentOrders}
        recentClients={recentClients}
        loading={loadingOrders || loadingClients}
      />
    </div>
  );
}
