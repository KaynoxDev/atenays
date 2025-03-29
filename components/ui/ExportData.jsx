'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileText, FileJson, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ExportData({ data, filename = 'export', fields = [], title = 'Exporter les données' }) {
  const [format, setFormat] = useState('csv');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState([]);
  const { toast } = useToast();
  
  // Extraire tous les champs disponibles automatiquement à partir des données
  const allFields = fields.length > 0 ? fields : 
    Array.isArray(data) && data.length > 0 ? 
      Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object') : [];

  const prepareDataForExport = () => {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const fieldsToExport = selectedFields.length > 0 ? selectedFields : allFields;
    
    if (format === 'csv') {
      // Entête CSV avec les noms de colonnes
      let csv = fieldsToExport.join(',') + '\n';
      
      // Lignes de données
      data.forEach(item => {
        const row = fieldsToExport.map(field => {
          const value = item[field];
          
          // Gérer les valeurs null/undefined
          if (value === null || value === undefined) return '';
          
          // Échapper les guillemets et encadrer avec des guillemets si contient une virgule
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csv += row.join(',') + '\n';
      });
      
      return csv;
    } 
    
    if (format === 'json') {
      // Filtrer les données pour n'inclure que les champs sélectionnés
      const filteredData = data.map(item => {
        const filteredItem = {};
        fieldsToExport.forEach(field => {
          filteredItem[field] = item[field];
        });
        return filteredItem;
      });
      
      return JSON.stringify(filteredData, null, 2);
    }
    
    // Format Excel (en fait CSV avec extension .xlsx)
    return prepareDataForExport();
  };
  
  const downloadData = () => {
    const exportData = prepareDataForExport();
    if (!exportData) {
      toast({
        title: "Erreur d'exportation",
        description: "Aucune donnée à exporter.",
        variant: "destructive"
      });
      return;
    }
    
    let mimeType = 'text/csv';
    let extension = '.csv';
    
    if (format === 'json') {
      mimeType = 'application/json';
      extension = '.json';
    } else if (format === 'xlsx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = '.xlsx';
    }
    
    const blob = new Blob([exportData], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}${extension}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setIsOpen(false);
    toast({
      title: "Exportation réussie",
      description: `Données exportées au format ${format.toUpperCase()}.`,
      variant: "success"
    });
  };
  
  const toggleFieldSelection = (field) => {
    setSelectedFields(prev => 
      prev.includes(field) ? 
        prev.filter(f => f !== field) : 
        [...prev, field]
    );
  };
  
  const toggleAllFields = () => {
    if (selectedFields.length === allFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields([...allFields]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Configurez et téléchargez vos données dans le format souhaité.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="font-medium text-sm">Format d'exportation</div>
            <Select 
              value={format} 
              onValueChange={setFormat}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>CSV (.csv)</span>
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    <span>Excel (.xlsx)</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    <span>JSON (.json)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">Champs à exporter</div>
              <Button 
                type="button" 
                variant="link" 
                size="sm"
                className="h-auto p-0"
                onClick={toggleAllFields}
              >
                {selectedFields.length === allFields.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
              {allFields.map(field => (
                <label key={field} className="flex items-center gap-2 cursor-pointer text-sm py-1">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field) || selectedFields.length === 0}
                    onChange={() => toggleFieldSelection(field)}
                  />
                  {field}
                </label>
              ))}
            </div>
          </div>
          
          <div className="text-muted-foreground text-sm">
            {Array.isArray(data) ? `${data.length} enregistrements disponibles.` : 'Aucune donnée disponible.'}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={downloadData}
            disabled={!Array.isArray(data) || data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
