'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useGet, apiPost, apiPut } from '@/hooks/useApi';
import { Save, RefreshCw, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminSettingsPage() {
  const { data: settings, loading, error, refetch } = useGet('/api/settings');
  const { toast, success, error: showError } = useToast();
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Aténays',
    siteDescription: 'Gestion de services métiers pour World of Warcraft',
    contactEmail: 'contact@example.com',
    discordInvite: 'https://discord.gg/example',
  });
  
  const [contentSettings, setContentSettings] = useState({
    homeHeroTitle: 'Aténays',
    homeHeroSubtitle: 'Suivez vos services de montée en métiers et les matériaux nécessaires pour World of Warcraft Cataclysm.',
    homeFeaturesSectionTitle: 'Fonctionnalités',
    homeProfessionsSectionTitle: 'Métiers Supportés',
    footerText: 'Gestion des services de montée en métiers dans World of Warcraft',
    aboutPageContent: 'À propos d\'Aténays...',
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    primaryColor: '#f58f00',
    secondaryColor: '#6d28d9',
    darkMode: true,
    showProfessionIcons: true,
    borderRadius: '0.5rem',
  });

  useEffect(() => {
    if (settings) {
      if (settings.general) {
        setGeneralSettings(settings.general);
      }
      
      if (settings.content) {
        setContentSettings(settings.content);
      }
      
      if (settings.appearance) {
        setAppearanceSettings(settings.appearance);
      }
    }
  }, [settings]);

  const saveSettings = async (section, data) => {
    try {
      let payload = {};
      
      if (!settings || !settings._id) {
        // Premier enregistrement des paramètres
        payload = {
          general: section === 'general' ? data : generalSettings,
          content: section === 'content' ? data : contentSettings,
          appearance: section === 'appearance' ? data : appearanceSettings
        };
        
        await apiPost('/api/settings', payload);
      } else {
        // Mise à jour des paramètres existants
        payload = { ...settings };
        payload[section] = data;
        
        await apiPut(`/api/settings/${settings._id}`, payload);
      }
      
      success({
        title: "Paramètres enregistrés",
        description: "Les paramètres ont été mis à jour avec succès."
      });
      
      // Recharger les paramètres
      refetch();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des paramètres:', err);
      showError({
        title: "Échec de l'enregistrement",
        description: "Une erreur est survenue lors de l'enregistrement des paramètres."
      });
    }
  };

  const handleGeneralSettingsChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleContentSettingsChange = (e) => {
    const { name, value } = e.target;
    setContentSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAppearanceSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppearanceSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  const handleSwitchChange = (name, checked) => {
    setAppearanceSettings(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Paramètres Globaux</h1>
          <p className="text-muted-foreground">Personnalisez l'apparence et le contenu du site</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Alert className="mb-6 bg-blue-50 border border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ces paramètres affectent l'ensemble de l'application. Certains changements peuvent nécessiter un redémarrage du serveur pour être pris en compte.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="general">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>
                Paramètres de base du site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="siteName">Nom du Site</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    value={generalSettings.siteName}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="siteDescription">Description du Site</Label>
                  <Input
                    id="siteDescription"
                    name="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email de Contact</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="discordInvite">Lien d'Invitation Discord</Label>
                  <Input
                    id="discordInvite"
                    name="discordInvite"
                    value={generalSettings.discordInvite}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => saveSettings('general', generalSettings)}>
                <Save className="h-4 w-4 mr-2" /> 
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Contenu du Site</CardTitle>
              <CardDescription>
                Personnalisez le contenu affiché sur les différentes pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="homeHeroTitle">Titre Principal (Page d'accueil)</Label>
                  <Input
                    id="homeHeroTitle"
                    name="homeHeroTitle"
                    value={contentSettings.homeHeroTitle}
                    onChange={handleContentSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="homeHeroSubtitle">Sous-titre (Page d'accueil)</Label>
                  <Input
                    id="homeHeroSubtitle"
                    name="homeHeroSubtitle"
                    value={contentSettings.homeHeroSubtitle}
                    onChange={handleContentSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="homeFeaturesSectionTitle">Titre Section Fonctionnalités</Label>
                  <Input
                    id="homeFeaturesSectionTitle"
                    name="homeFeaturesSectionTitle"
                    value={contentSettings.homeFeaturesSectionTitle}
                    onChange={handleContentSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="homeProfessionsSectionTitle">Titre Section Métiers</Label>
                  <Input
                    id="homeProfessionsSectionTitle"
                    name="homeProfessionsSectionTitle"
                    value={contentSettings.homeProfessionsSectionTitle}
                    onChange={handleContentSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="footerText">Texte du Pied de Page</Label>
                  <Input
                    id="footerText"
                    name="footerText"
                    value={contentSettings.footerText}
                    onChange={handleContentSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="aboutPageContent">Contenu de la Page À Propos</Label>
                  <Textarea
                    id="aboutPageContent"
                    name="aboutPageContent"
                    rows={6}
                    value={contentSettings.aboutPageContent}
                    onChange={handleContentSettingsChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => saveSettings('content', contentSettings)}>
                <Save className="h-4 w-4 mr-2" /> 
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
              <CardDescription>
                Personnalisez l'apparence visuelle du site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryColor">Couleur Principale</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        name="primaryColor"
                        type="color"
                        className="w-12 h-10 p-1"
                        value={appearanceSettings.primaryColor}
                        onChange={handleAppearanceSettingsChange}
                      />
                      <Input
                        name="primaryColor"
                        value={appearanceSettings.primaryColor}
                        onChange={handleAppearanceSettingsChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Couleur Secondaire</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        name="secondaryColor"
                        type="color"
                        className="w-12 h-10 p-1"
                        value={appearanceSettings.secondaryColor}
                        onChange={handleAppearanceSettingsChange}
                      />
                      <Input
                        name="secondaryColor"
                        value={appearanceSettings.secondaryColor}
                        onChange={handleAppearanceSettingsChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="borderRadius">Rayon des Bordures</Label>
                    <Input
                      id="borderRadius"
                      name="borderRadius"
                      value={appearanceSettings.borderRadius}
                      onChange={handleAppearanceSettingsChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="darkMode">Mode Sombre par défaut</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer le mode sombre par défaut
                      </p>
                    </div>
                    <Switch
                      id="darkMode"
                      name="darkMode"
                      checked={appearanceSettings.darkMode}
                      onCheckedChange={(checked) => handleSwitchChange('darkMode', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showProfessionIcons">Afficher les icônes de métiers</Label>
                      <p className="text-sm text-muted-foreground">
                        Afficher les émojis des métiers dans l'interface
                      </p>
                    </div>
                    <Switch
                      id="showProfessionIcons"
                      name="showProfessionIcons"
                      checked={appearanceSettings.showProfessionIcons}
                      onCheckedChange={(checked) => handleSwitchChange('showProfessionIcons', checked)}
                    />
                  </div>
                  
                  <div className="mt-6 p-4 rounded-lg border border-muted">
                    <h3 className="text-sm font-medium mb-2">Aperçu (Exemple)</h3>
                    <div 
                      className="p-4 rounded-lg" 
                      style={{ 
                        backgroundColor: appearanceSettings.darkMode ? '#1a2332' : '#ffffff',
                        color: appearanceSettings.darkMode ? '#f8f9fa' : '#1a2332',
                        borderRadius: appearanceSettings.borderRadius
                      }}
                    >
                      <div 
                        className="mb-2"
                        style={{ color: appearanceSettings.primaryColor }}
                      >
                        Titre en couleur principale
                      </div>
                      <div className="mb-2">
                        Texte normal
                      </div>
                      <div>
                        <button 
                          className="px-3 py-1 rounded-md text-white"
                          style={{ 
                            backgroundColor: appearanceSettings.primaryColor,
                            borderRadius: appearanceSettings.borderRadius
                          }}
                        >
                          Bouton principal
                        </button>
                        <button
                          className="px-3 py-1 rounded-md text-white ml-2"
                          style={{ 
                            backgroundColor: appearanceSettings.secondaryColor,
                            borderRadius: appearanceSettings.borderRadius
                          }}
                        >
                          Bouton secondaire
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => saveSettings('appearance', appearanceSettings)}>
                <Save className="h-4 w-4 mr-2" /> 
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
