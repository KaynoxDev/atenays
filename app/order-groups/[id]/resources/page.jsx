'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPut, useGet } from '@/hooks/useApi';
import { ArrowLeft, FilePdf, Loader2 } from 'lucide-react';
import Link from 'next/link';
import OrderResources from '@/components/ui/OrderResources';

export default function GroupResourcesPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [checkedResources, setCheckedResources] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Récupérer les données du groupe
  const { 
    data: groupData, 
    loading: loadingGroup,
    error: groupError 
  } = useGet(`/api/order-groups/${id}/resources`);
  
  const groupName = groupData?.groupName || 'Groupe de commandes';
  const professions = groupData?.professions || [];
  
  // Charger les ressources cochées depuis le groupe
  useEffect(() => {
    if (groupData?.checkedResources) {
      setCheckedResources(groupData.checkedResources);
    }
  }, [groupData?.checkedResources]);
  
  // Gérer la mise à jour du statut des ressources
  const handleToggleResource = (resourceId, checked) => {
    setCheckedResources(prev => ({
      ...prev,
      [resourceId]: checked
    }));
  };
  
  // Grouper les professions par client pour l'affichage
  const professionsByClient = professions.reduce((acc, prof) => {
    if (!acc[prof.clientId]) {
      acc[prof.clientId] = {
        clientName: prof.clientName,
        orderName: prof.orderName,
        professions: []
      };
    }
    
    acc[prof.clientId].professions.push(prof);
    return acc;
  }, {});
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Ressources du Groupe</h1>
          <p className="text-muted-foreground">
            {loadingGroup ? 'Chargement...' : 
              `${groupName} - ${groupData?.orderCount || 0} commandes`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/orders">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux commandes
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Afficher les commandes incluses dans ce groupe */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Commandes dans ce groupe</CardTitle>
          <CardDescription>
            {Object.keys(professionsByClient).length} clients, {professions.length} professions au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(professionsByClient).map(([clientId, client]) => (
              <div key={clientId} className="border-b pb-4 last:border-0">
                <div className="font-medium mb-2">{client.clientName}</div>
                <div className="flex flex-wrap gap-2">
                  {client.professions.map((prof, idx) => (
                    <div key={`${clientId}-${idx}`} className="bg-muted px-3 py-1 rounded-md text-sm">
                      {prof.name} (1-{prof.levelRange})
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Afficher les ressources combinées */}
      {loadingGroup ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : groupError ? (
        <Card>
          <CardContent className="text-center py-8 text-destructive">
            Erreur lors du chargement des données du groupe
          </CardContent>
        </Card>
      ) : professions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Aucune profession trouvée dans ce groupe
          </CardContent>
        </Card>
      ) : (
        <OrderResources 
          order={{ _id: id, name: groupName }}
          professions={professions}
          checkedResources={checkedResources}
          onToggleResource={handleToggleResource}
          isGroupView={true}
        />
      )}
    </div>
  );
}
