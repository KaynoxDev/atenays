'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Moon, Sun, Type, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { preferences, updatePreferences, toggleDarkMode, isDarkMode } = useUserPreferences();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('display');
  
  const fontSizeOptions = [
    { label: 'Petit', value: 'small' },
    { label: 'Moyen', value: 'medium' },
    { label: 'Grand', value: 'large' }
  ];
  
  const handleFontSizeChange = (size) => {
    updatePreferences({ fontSize: size });
    toast({
      title: "Taille de police mise à jour",
      description: "La taille de police a été modifiée avec succès."
    });
  };
  
  const handleHighContrastChange = (checked) => {
    updatePreferences({ highContrast: checked });
    toast({
      title: "Contraste modifié",
      description: checked 
        ? "Le mode contraste élevé a été activé."
        : "Le mode contraste élevé a été désactivé."
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Paramètres</h1>
          <p className="text-muted-foreground">Personnalisez votre expérience</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="display">Affichage</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibilité</TabsTrigger>
        </TabsList>
        
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'affichage</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application selon vos préférences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <div>
                    <Label htmlFor="theme-mode">Mode sombre</Label>
                    <p className="text-sm text-muted-foreground">
                      Réduisez la fatigue oculaire dans les environnements faiblement éclairés
                    </p>
                  </div>
                </div>
                <Switch 
                  id="theme-mode"
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Type className="h-5 w-5" />
                  <Label>Taille de police</Label>
                </div>
                <RadioGroup 
                  value={preferences.fontSize} 
                  onValueChange={handleFontSizeChange}
                  className="flex flex-col space-y-3"
                >
                  {fontSizeOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`font-${option.value}`} />
                      <Label 
                        htmlFor={`font-${option.value}`}
                        className={option.value === 'large' ? 'text-lg' : option.value === 'small' ? 'text-xs' : ''}
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="accessibility">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'accessibilité</CardTitle>
              <CardDescription>
                Options pour améliorer l'accessibilité et le confort d'utilisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Eye className="h-5 w-5" />
                  <div>
                    <Label htmlFor="high-contrast">Contraste élevé</Label>
                    <p className="text-sm text-muted-foreground">
                      Augmente le contraste pour améliorer la lisibilité
                    </p>
                  </div>
                </div>
                <Switch 
                  id="high-contrast"
                  checked={preferences.highContrast}
                  onCheckedChange={handleHighContrastChange}
                />
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Ces paramètres sont conçus pour réduire la fatigue oculaire et améliorer l'accessibilité.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
