import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiPost, apiDelete } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

export default function MaterialCalculator({ professionName, levelRange, editable = false }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    iconName: '',
    quantity: '',
    profession: professionName,
    levelRange: levelRange
  });
  
  // Utiliser useRef pour éviter des requêtes redondantes
  const fetchedRef = useRef(false);
  const lastParamsRef = useRef({ professionName, levelRange });
  const { toast, success, error } = useToast();
  const abortControllerRef = useRef(null);

  // Effet pour charger les matériaux une seule fois par changement de profession/niveau significatif
  useEffect(() => {
    // Annuler les requêtes précédentes si nécessaire
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouvel AbortController pour cette requête
    abortControllerRef.current = new AbortController();
    
    // Vérifier si les paramètres ont changé pour éviter des requêtes inutiles
    const paramsChanged = 
      lastParamsRef.current.professionName !== professionName || 
      lastParamsRef.current.levelRange !== levelRange;
    
    if (!fetchedRef.current || paramsChanged) {
      setLoading(true);
      lastParamsRef.current = { professionName, levelRange };
      
      const fetchMaterials = async () => {
        try {
          const response = await fetch(
            `/api/materials?profession=${encodeURIComponent(professionName)}&levelRange=${levelRange}`,
            { signal: abortControllerRef.current.signal }
          );
          
          if (!response.ok) {
            throw new Error('Échec du chargement des matériaux');
          }
          
          const data = await response.json();
          setMaterials(data);
          fetchedRef.current = true;
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error("Erreur lors de la récupération des matériaux:", err);
            error({
              title: "Erreur de chargement",
              description: "Impossible de récupérer les matériaux. Veuillez réessayer."
            });
          }
        } finally {
          setLoading(false);
        }
      };

      // Ajouter un délai court pour éviter les requêtes simultanées
      const timer = setTimeout(() => {
        fetchMaterials();
      }, 300);
      
      return () => {
        clearTimeout(timer);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [professionName, levelRange, error]);

  // Mettre à jour le newMaterial quand professionName ou levelRange change
  useEffect(() => {
    setNewMaterial(prev => ({
      ...prev,
      profession: professionName,
      levelRange: levelRange
    }));
  }, [professionName, levelRange]);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    
    if (!newMaterial.name || !newMaterial.quantity) {
      error({
        title: "Champs manquants",
        description: "Le nom et la quantité sont requis."
      });
      return;
    }
    
    try {
      const createdMaterial = await apiPost('/api/materials', newMaterial);
      
      setMaterials(prev => [...prev, createdMaterial]);
      setIsAddDialogOpen(false);
      setNewMaterial({
        name: '',
        iconName: '',
        quantity: '',
        profession: professionName,
        levelRange: levelRange
      });
      
      success({
        title: "Matériau ajouté",
        description: `${createdMaterial.name} a été ajouté avec succès.`
      });
    } catch (err) {
      console.error("Erreur lors de l'ajout du matériau:", err);
      error({
        title: "Échec de l'ajout",
        description: "Impossible d'ajouter le matériau. Veuillez réessayer."
      });
    }
  };

  const handleDeleteMaterial = async (id) => {
    try {
      await apiDelete(`/api/materials/${id}`);
      setMaterials(prev => prev.filter(material => material._id !== id));
      
      success({
        title: "Matériau supprimé",
        description: "Le matériau a été supprimé avec succès."
      });
    } catch (err) {
      console.error("Erreur lors de la suppression du matériau:", err);
      error({
        title: "Échec de la suppression",
        description: "Impossible de supprimer le matériau. Veuillez réessayer."
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          Matériaux requis pour {professionName} {levelRange}
        </h3>
        
        {editable && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un matériau</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau matériau requis pour {professionName} {levelRange}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddMaterial}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nom
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={newMaterial.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="iconName" className="text-right">
                      Icône
                    </Label>
                    <Input
                      id="iconName"
                      name="iconName"
                      value={newMaterial.iconName}
                      onChange={handleInputChange}
                      placeholder="inv_misc_herb_01"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">
                      Quantité
                    </Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={newMaterial.quantity}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Ajouter</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          Aucun matériau trouvé pour {professionName} {levelRange}
          {editable && <div className="mt-2">Cliquez sur "Ajouter" pour commencer</div>}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matériau</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              {editable && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => (
              <TableRow key={material._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {material.iconName && (
                      <img 
                        src={`https://wow.zamimg.com/images/wow/icons/small/${material.iconName.toLowerCase()}.jpg`}
                        alt={material.name}
                        className="w-6 h-6 mr-2 rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                        }}
                      />
                    )}
                    {material.name}
                  </div>
                </TableCell>
                <TableCell className="text-right">{material.quantity}</TableCell>
                {editable && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMaterial(material._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function getProfessionEmoji(profession) {
  const icons = {
    'Blacksmithing': '🔨',
    'Tailoring': '🧵',
    'Leatherworking': '🧶',
    'Engineering': '⚙️',
    'Alchemy': '⚗️',
    'Enchanting': '✨',
    'Jewelcrafting': '💎',
    'Inscription': '📜',
  };
  return icons[profession] || '📋';
}
