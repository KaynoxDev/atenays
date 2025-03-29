"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { apiPut } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

export default function DocumentForm({ document, collectionName, onSave, onCancel }) {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast, success, error: showError } = useToast();

  // Initialiser le formulaire avec les données du document
  useEffect(() => {
    if (document) {
      // Créer une copie modifiable du document en excluant certains champs spéciaux
      const initialData = { ...document };
      delete initialData._id; // _id est géré par MongoDB et ne doit pas être modifié
      setFormData(initialData);
    }
  }, [document]);

  // Gérer les changements dans les champs de formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Traiter les différents types de données
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: parseFloat(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Gérer les changements de valeurs de switch
  const handleSwitchChange = (name, checked) => {
    setFormData({ ...formData, [name]: checked });
  };

  // Soumettre les modifications
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Si le document a un _id, nous mettons à jour un document existant
      if (document?._id) {
        await apiPut(`/api/database/collections/${collectionName}/documents/${document._id}`, formData);
        success({
          title: "Document mis à jour",
          description: "Les modifications ont été enregistrées avec succès."
        });
      }
      
      if (onSave) {
        onSave({ ...formData, _id: document._id });
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du document:', err);
      showError({
        title: "Échec de l'enregistrement",
        description: "Une erreur est survenue lors de l'enregistrement des modifications."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Détecter le type d'une valeur pour afficher le bon composant de formulaire
  const getInputType = (key, value) => {
    // Ne pas afficher les objets imbriqués comme des champs de formulaire
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return 'object';
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    if (key.toLowerCase().includes('date') || key === 'createdAt' || key === 'updatedAt') {
      return 'date';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'string' && value.length > 50) {
      return 'textarea';
    }

    return 'text';
  };

  if (!document) {
    return <div>Aucun document à afficher.</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Modifier le Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(formData).map(([key, value]) => {
            const inputType = getInputType(key, value);

            if (inputType === 'object') {
              return (
                <div key={key} className="border p-3 rounded-md">
                  <Label className="block mb-2">{key} (Objet)</Label>
                  <pre className="bg-muted/30 p-2 rounded text-xs overflow-auto max-h-[100px]">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              );
            }

            if (inputType === 'array') {
              return (
                <div key={key} className="border p-3 rounded-md">
                  <Label className="block mb-2">{key} (Tableau - {value.length} éléments)</Label>
                  <pre className="bg-muted/30 p-2 rounded text-xs overflow-auto max-h-[100px]">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              );
            }

            if (inputType === 'boolean') {
              return (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key}>{key}</Label>
                  <Switch
                    id={key}
                    name={key}
                    checked={Boolean(value)}
                    onCheckedChange={(checked) => handleSwitchChange(key, checked)}
                  />
                </div>
              );
            }

            if (inputType === 'date') {
              const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
              return (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key}>{key}</Label>
                  <Input
                    type="date"
                    id={key}
                    name={key}
                    value={dateValue}
                    onChange={handleInputChange}
                  />
                </div>
              );
            }

            if (inputType === 'textarea') {
              return (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key}>{key}</Label>
                  <Textarea
                    id={key}
                    name={key}
                    value={String(value || '')}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
              );
            }

            // Champs par défaut (texte, nombre, etc.)
            return (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{key}</Label>
                <Input
                  type={inputType}
                  id={key}
                  name={key}
                  value={String(value || '')}
                  onChange={handleInputChange}
                />
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            type="button" 
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" /> Annuler
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-1" /> Enregistrer
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
