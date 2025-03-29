'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useGet, apiPut } from '@/hooks/useApi';
import OrderDetails from '@/components/ui/OrderDetails';
import OrderResources from '@/components/ui/OrderResources'; // Nouveau composant
import { ArrowLeft, Calculator } from 'lucide-react';
import Link from 'next/link';
import MultiProfessionCalculator from '@/components/ui/MultiProfessionCalculator';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const { data: order, loading, error: orderError, refetch } = 
    useGet(`/api/orders/${params.id}`, null);
  
  const [activeTab, setActiveTab] = useState('details');
  const [showCalculator, setShowCalculator] = useState(false);

  // État local pour gérer les ressources cochées
  const [checkedResources, setCheckedResources] = useState({});
  
  // Charger l'état des ressources cochées depuis l'ordre lors du chargement
  useEffect(() => {
    if (order && order.checkedResources) {
      setCheckedResources(order.checkedResources);
    }
  }, [order]);

  // Fonction pour basculer l'état d'une ressource
  const toggleResourceChecked = async (resourceId, checked) => {
    const newCheckedResources = {
      ...checkedResources,
      [resourceId]: checked
    };
    
    setCheckedResources(newCheckedResources);
    
    try {
      // Mettre à jour l'ordre dans la base de données avec les ressources cochées
      await apiPut(`/api/orders/${params.id}/resources`, {
        checkedResources: newCheckedResources
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour des ressources cochées:", err);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'état des ressources.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
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
  
  if (orderError || !order) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>Impossible de charger les détails de la commande</CardDescription>
          </CardHeader>
          <CardContent>
            <p>La commande demandée n'a pas été trouvée ou une erreur s'est produite.</p>
            <Button className="mt-4" onClick={() => router.push('/orders')}>
              Retour à la liste des commandes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Préparer les données de profession pour le calculateur
  const professions = order.professions?.map(prof => ({
    name: prof.name,
    levelRange: prof.levelRange || '525'
  })) || [];

  // Si ancienne structure de données, utiliser la compatibilité
  if (!professions.length && order.profession) {
    professions.push({
      name: order.profession,
      levelRange: order.levelRange || '525'
    });
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary">Commande #{params.id.substring(0, 7)}</h1>
        </div>
        
        <Button 
          variant="outline"
          onClick={() => setShowCalculator(!showCalculator)}
        >
          <Calculator className="h-4 w-4 mr-2" />
          {showCalculator ? 'Masquer le calculateur' : 'Calculateur de matériaux'}
        </Button>
      </div>
      
      {showCalculator && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Calculateur de Matériaux</CardTitle>
            <CardDescription>
              Calculez les matériaux nécessaires pour cette commande
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiProfessionCalculator initialProfessions={professions} />
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <OrderDetails 
            order={order} 
            onUpdateOrder={refetch}
            onUpdateStatus={() => {
              refetch();
              toast({
                title: "Statut mis à jour",
                description: "Le statut de la commande a été mis à jour avec succès."
              });
            }}
          />
        </TabsContent>
        
        <TabsContent value="resources">
          <OrderResources 
            order={order}
            professions={professions}
            checkedResources={checkedResources}
            onToggleResource={toggleResourceChecked}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
