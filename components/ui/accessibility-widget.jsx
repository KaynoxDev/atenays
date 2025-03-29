'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, Moon, Sun, Type, Activity } from 'lucide-react';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  // Use a ref to prevent the infinite loop
  const { settings, toggleDarkMode, toggleHighContrast, setFontSize, toggleReducedMotion } = useAccessibilitySettings();

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-4 z-50">
      {/* Bouton flottant pour ouvrir le widget */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full shadow-lg"
        variant={isOpen ? "secondary" : "default"}
      >
        <Eye className="h-6 w-6" />
      </Button>
      
      {/* Widget d'accessibilité - Use a conditional rendering approach that doesn't cause re-renders */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-[300px] shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle>Options d'accessibilité</CardTitle>
            <CardDescription>Paramètres pour un meilleur confort visuel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Label htmlFor="dark-mode">Mode sombre</Label>
              </div>
              <Switch 
                id="dark-mode" 
                checked={settings.darkMode} 
                onCheckedChange={toggleDarkMode} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <Label htmlFor="high-contrast">Contraste élevé</Label>
              </div>
              <Switch 
                id="high-contrast" 
                checked={settings.highContrast} 
                onCheckedChange={toggleHighContrast} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <Label htmlFor="reduced-motion">Réduire les animations</Label>
              </div>
              <Switch 
                id="reduced-motion" 
                checked={settings.reducedMotion} 
                onCheckedChange={toggleReducedMotion} 
              />
            </div>
            
            <div className="pt-2">
              <Label className="mb-2 block">Taille du texte</Label>
              <div className="flex justify-between">
                <Button 
                  variant={settings.fontSize === 'small' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFontSize('small')}
                >
                  <Type className="h-3 w-3 mr-1" /> Petit
                </Button>
                <Button 
                  variant={settings.fontSize === 'medium' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFontSize('medium')}
                >
                  <Type className="h-4 w-4 mr-1" /> Moyen
                </Button>
                <Button 
                  variant={settings.fontSize === 'large' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFontSize('large')}
                >
                  <Type className="h-5 w-5 mr-1" /> Grand
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="w-full">
              Fermer
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
