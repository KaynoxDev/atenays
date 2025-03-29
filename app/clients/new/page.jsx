'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/hooks/useApi';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use an object instead of multiple state variables to avoid synchronization issues
  const [clientData, setClientData] = useState({
    name: '',
    realm: '',
    discord: '',
    character: '',
    notes: ''
  });
  
  // Use a callback to avoid re-creation of the function during renders
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setClientData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clientData.name) {
      toast({
        title: "Erreur",
        description: "Le nom du client est requis",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newClient = {
        ...clientData,
        joinedDate: new Date().toISOString()
      };
      
      const result = await apiPost('/api/clients', newClient);
      
      toast({
        title: "Client créé",
        description: "Le client a été créé avec succès."
      });
      
      // Redirect to the client's page
      if (result && result._id) {
        router.push(`/clients/${result._id}`);
      } else {
        router.push('/clients');
      }
    } catch (err) {
      console.error('Erreur lors de la création du client:', err);
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue lors de la création du client.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Nouveau Client</h1>
          <p className="text-muted-foreground">Créer un nouveau client dans votre base de données</p>
        </div>
        <Link href="/clients">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux clients
          </Button>
        </Link>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations client</CardTitle>
            <CardDescription>Entrez les détails du nouveau client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                name="name"
                value={clientData.name}
                onChange={handleChange}
                placeholder="Nom du client"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="realm">Royaume</Label>
              <Input
                id="realm"
                name="realm"
                value={clientData.realm}
                onChange={handleChange}
                placeholder="Serveur WoW"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discord">Discord</Label>
              <Input
                id="discord"
                name="discord"
                value={clientData.discord}
                onChange={handleChange}
                placeholder="Nom d'utilisateur Discord"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="character">Personnage principal</Label>
              <Input
                id="character"
                name="character"
                value={clientData.character}
                onChange={handleChange}
                placeholder="Nom du personnage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={clientData.notes}
                onChange={handleChange}
                placeholder="Notes ou informations supplémentaires..."
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Création en cours...' : 'Créer le client'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
