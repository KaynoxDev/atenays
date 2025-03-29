'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, FileJson, Table as TableIcon, RefreshCw, Download, 
  Search, ChevronLeft, ChevronRight, Eye, Edit, Trash2, Info, RotateCw, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiDelete } from '@/hooks/useApi';

export default function AdminDatabasePage() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filterCollection, setFilterCollection] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  
  const { toast, success, error } = useToast();

  // Charger les collections au chargement de la page
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/database/collections');
        if (!response.ok) throw new Error('Échec du chargement des collections');
        
        const data = await response.json();
        setCollections(data);
        
        // Sélectionner la première collection par défaut
        if (data.length > 0 && !selectedCollection) {
          setSelectedCollection(data[0]);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des collections:', err);
        error({
          title: "Erreur",
          description: "Impossible de charger les collections de la base de données."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollections();
  }, []);

  // Charger les documents lorsqu'une collection est sélectionnée
  useEffect(() => {
    if (!selectedCollection) return;
    
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          sortField,
          sortOrder,
          search
        });
        
        const response = await fetch(`/api/database/collections/${selectedCollection}/documents?${queryParams}`);
        if (!response.ok) throw new Error('Échec du chargement des documents');
        
        const data = await response.json();
        setDocuments(data.documents || []);
        setTotalDocuments(data.total || 0);
      } catch (err) {
        console.error('Erreur lors du chargement des documents:', err);
        error({
          title: "Erreur",
          description: "Impossible de charger les documents de la collection."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [selectedCollection, page, pageSize, sortField, sortOrder, search]);

  // Ouvrir la boîte de dialogue pour voir un document
  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  // Confirmer la suppression d'un document
  const handleDeleteConfirmation = (document) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  // Supprimer un document
  const handleDeleteDocument = async () => {
    if (!documentToDelete || !documentToDelete._id) return;
    
    try {
      await apiDelete(`/api/database/collections/${selectedCollection}/documents/${documentToDelete._id}`);
      
      // Mettre à jour la liste des documents
      setDocuments(documents.filter(doc => doc._id !== documentToDelete._id));
      setTotalDocuments(totalDocuments - 1);
      
      // Fermer la boîte de dialogue et réinitialiser
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
      
      success({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès."
      });
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err);
      error({
        title: "Erreur",
        description: "Impossible de supprimer le document."
      });
    }
  };

  // Nombre total de pages
  const totalPages = Math.ceil(totalDocuments / pageSize);

  // Pour l'affichage de l'aperçu JSON formaté
  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  // Génère les colonnes de la table en fonction du premier document
  const getColumns = () => {
    if (!documents || documents.length === 0) return ['Aucun document'];
    
    // Toujours afficher l'ID en premier
    const columns = ['_id'];
    
    // Ajouter les autres champs communs
    const commonFields = ['name', 'title', 'clientName', 'profession', 'status', 'createdAt', 'price'];
    commonFields.forEach(field => {
      if (documents[0][field] !== undefined && !columns.includes(field)) {
        columns.push(field);
      }
    });
    
    // Ajouter les autres champs du premier document (limité à 5 pour éviter une table trop large)
    Object.keys(documents[0]).forEach(key => {
      if (!columns.includes(key) && columns.length < 8) {
        columns.push(key);
      }
    });
    
    return columns;
  };

  // Formater les valeurs pour l'affichage dans le tableau
  const formatCellValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') {
      if (value instanceof Date) return new Date(value).toLocaleDateString();
      if (Array.isArray(value)) return `[${value.length} éléments]`;
      return '{...}';
    }
    if (typeof value === 'string') {
      // Formater les dates
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          return new Date(value).toLocaleDateString();
        } catch (e) {
          // Si la conversion échoue, renvoyer la valeur d'origine
        }
      }
      
      // Raccourcir les chaînes longues
      if (value.length > 50) {
        return value.substring(0, 47) + '...';
      }
    }
    return String(value);
  };

  // Filtrer les collections
  const filteredCollections = filterCollection ? 
    collections.filter(c => c.toLowerCase().includes(filterCollection.toLowerCase())) : 
    collections;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Base de Données</h1>
          <p className="text-muted-foreground">Explorez et gérez les données stockées dans MongoDB</p>
        </div>
      </div>

      <Alert className="mb-6 bg-amber-50 border border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-800" />
        <AlertTitle className="text-amber-800">Mode administrateur</AlertTitle>
        <AlertDescription className="text-amber-700">
          Cette fonctionnalité est en version préliminaire. Manipulez les données avec précaution car les modifications sont directes et ne peuvent pas être annulées.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar avec collections */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" /> Collections
              </CardTitle>
              <CardDescription>
                {collections.length} collections disponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 p-0">
              <div className="px-4 pb-2">
                <Input
                  placeholder="Rechercher une collection..."
                  className="mb-2"
                  value={filterCollection}
                  onChange={(e) => setFilterCollection(e.target.value)}
                />
              </div>
              <div className="h-[600px] overflow-y-auto">
                {filteredCollections.map(collection => (
                  <button
                    key={collection}
                    className={`w-full text-left py-2 px-4 hover:bg-muted transition-colors ${
                      selectedCollection === collection ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                    onClick={() => {
                      setSelectedCollection(collection);
                      setPage(1);
                      setSearch('');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{collection}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Contenu principal */}
        <div className="lg:col-span-3">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedCollection}</CardTitle>
                  <CardDescription>
                    {totalDocuments} documents trouvés
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={loading}
                    onClick={() => {
                      setPage(1);
                      // Recharger les documents
                      const currentCollection = selectedCollection;
                      setSelectedCollection('');
                      setTimeout(() => setSelectedCollection(currentCollection), 100);
                    }}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={documents.length === 0}
                    onClick={() => {
                      // Logique d'exportation des données
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(documents, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", `${selectedCollection}_export.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none">
                <Select
                  value={sortField}
                  onValueChange={(value) => {
                    setSortField(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_id">ID</SelectItem>
                    <SelectItem value="createdAt">Date de création</SelectItem>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="updatedAt">Dernière mise à jour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 sm:flex-none">
                <Select
                  value={sortOrder}
                  onValueChange={(value) => {
                    setSortOrder(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ordre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascendant</SelectItem>
                    <SelectItem value="desc">Descendant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-muted rounded-md flex">
                <Button 
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'json' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('json')}
                >
                  <FileJson className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <RotateCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <Database className="h-12 w-12 mb-4 opacity-20" />
                  <p>Aucun document trouvé</p>
                  <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                </div>
              ) : viewMode === 'table' ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {getColumns().map(column => (
                            <TableHead 
                              key={column} 
                              className="cursor-pointer hover:text-primary"
                              onClick={() => {
                                if (sortField === column) {
                                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setSortField(column);
                                  setSortOrder('asc');
                                }
                              }}
                            >
                              {column} {sortField === column && (sortOrder === 'asc' ? '↑' : '↓')}
                            </TableHead>
                          ))}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map(doc => (
                          <TableRow key={doc._id}>
                            {getColumns().map(column => (
                              <TableCell key={`${doc._id}-${column}`}>
                                {formatCellValue(doc[column])}
                              </TableCell>
                            ))}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteConfirmation(doc)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="p-4">
                  <Tabs defaultValue="pretty">
                    <TabsList className="mb-2">
                      <TabsTrigger value="pretty">JSON formaté</TabsTrigger>
                      <TabsTrigger value="raw">JSON brut</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pretty" className="overflow-auto">
                      <pre className="p-4 text-xs bg-muted/30 rounded-md h-[500px] overflow-auto">
                        {formatJSON(documents)}
                      </pre>
                    </TabsContent>
                    <TabsContent value="raw">
                      <pre className="p-4 text-xs bg-muted/30 rounded-md h-[500px] overflow-auto">
                        {JSON.stringify(documents)}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNumber = page <= 3 
                        ? i + 1 
                        : page >= totalPages - 2 
                          ? totalPages - 4 + i 
                          : page - 2 + i;
                          
                      if (pageNumber <= 0 || pageNumber > totalPages) return null;
                      
                      return (
                        <Button
                          key={i}
                          variant={page === pageNumber ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Boîte de dialogue pour afficher un document */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Détails du document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <pre className="p-4 text-xs bg-muted/30 rounded-md max-h-[500px] overflow-auto">
              {selectedDocument ? formatJSON(selectedDocument) : ''}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.</p>
            {documentToDelete && (
              <div className="mt-4 p-2 bg-muted/30 rounded-md text-xs overflow-auto max-h-[200px]">
                <pre>{formatJSON({ _id: documentToDelete._id, ...documentToDelete })}</pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteDocument}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
