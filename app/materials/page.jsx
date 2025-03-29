'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MaterialCalculator from '@/components/ui/MaterialCalculator';

export default function MaterialsPage() {
  const [selectedProfession, setSelectedProfession] = useState('Blacksmithing');
  const [levelRange, setLevelRange] = useState('525');
  
  const professions = [
    'Blacksmithing',
    'Tailoring',
    'Leatherworking',
    'Engineering',
    'Alchemy',
    'Enchanting',
    'Jewelcrafting',
    'Inscription',
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Calculateur de Matériaux</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Sélection de Métier</CardTitle>
              <CardDescription>
                Choisissez un métier pour calculer les matériaux requis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Métier</label>
                <Select
                  value={selectedProfession}
                  onValueChange={setSelectedProfession}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un métier" />
                  </SelectTrigger>
                  <SelectContent>
                    {professions.map((profession) => (
                      <SelectItem key={profession} value={profession}>
                        <div className="flex items-center">
                          <span className="mr-2">{getProfessionEmoji(profession)}</span>
                          {profession}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Niveau Cible</label>
                <Select
                  value={levelRange}
                  onValueChange={setLevelRange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau cible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="225">225 (Classic)</SelectItem>
                    <SelectItem value="300">300 (Vanilla)</SelectItem>
                    <SelectItem value="375">375 (TBC)</SelectItem>
                    <SelectItem value="450">450 (WotLK)</SelectItem>
                    <SelectItem value="525">525 (Cataclysm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-amber-50 p-4 rounded border border-amber-200">
                <h3 className="font-medium mb-2 text-amber-800">Information sur le Métier</h3>
                <p className="text-sm text-amber-700">
                  {getProfessionDescription(selectedProfession)}
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <h3 className="font-medium mb-2 text-blue-800">Guide de Prix</h3>
                <ul className="list-disc pl-5 text-sm text-blue-700">
                  <li>1-300: ~800-1200 or</li>
                  <li>1-375: ~1500-2000 or</li>
                  <li>1-450: ~2500-3000 or</li>
                  <li>1-525: ~3500-5000 or</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Questions Fréquentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Combien de temps prend la montée en compétence?</h3>
                  <p className="text-sm text-muted-foreground">
                    Généralement 2-3 jours selon la disponibilité des matériaux et la complexité du métier.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Dois-je fournir les matériaux?</h3>
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez fournir les matériaux pour réduire le coût, ou nous pouvons nous occuper de tout.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Proposez-vous des réductions?</h3>
                  <p className="text-sm text-muted-foreground">
                    Oui, commandez plusieurs métiers pour une réduction de 10-15% sur le prix total.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Liste des Matériaux</CardTitle>
                <CardDescription>
                  Liste complète des matériaux pour {selectedProfession} 1-{levelRange}
                </CardDescription>
              </div>
              <Button variant="outline">
                Exporter la Liste
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">Tous les Matériaux</TabsTrigger>
                  <TabsTrigger value="by-phase">Par Phase</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <MaterialCalculator professionName={selectedProfession} levelRange={levelRange} />
                </TabsContent>
                <TabsContent value="by-phase">
                  <div className="space-y-6">
                    <MaterialCalculator professionName={selectedProfession} levelRange="225" />
                    {levelRange >= "300" && (
                      <MaterialCalculator professionName={selectedProfession} levelRange="300" />
                    )}
                    {levelRange >= "375" && (
                      <MaterialCalculator professionName={selectedProfession} levelRange="375" />
                    )}
                    {levelRange >= "450" && (
                      <MaterialCalculator professionName={selectedProfession} levelRange="450" />
                    )}
                    {levelRange >= "525" && (
                      <MaterialCalculator professionName={selectedProfession} levelRange="525" />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Commander ce Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Prêt à monter votre niveau de {selectedProfession}?</p>
                <Button className="w-full">Commander Maintenant</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Besoin d'Aide?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Des questions sur les matériaux ou la montée en compétence?</p>
                <Button variant="outline" className="w-full">Contacter le Support</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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

function getProfessionDescription(profession) {
  const descriptions = {
    'Blacksmithing': 'Create weapons, armor, and gear enhancements using metal bars and stones. Specializations available in Weaponsmith or Armorsmith.',
    'Tailoring': 'Craft cloth armor, bags, and magical garments using various cloth types collected from humanoids.',
    'Leatherworking': 'Create leather and mail armor using hides and skins from beasts. Can specialize in Dragonscale, Elemental, or Tribal Leatherworking.',
    'Engineering': 'Build gadgets, explosives, and unique mechanical items using metal bars and special components.',
    'Alchemy': 'Brew potions, elixirs, and flasks using herbs. Can transmute materials and create special stones.',
    'Enchanting': 'Enhance gear with magical effects using materials from disenchanted magical items.',
    'Jewelcrafting': 'Cut gems to provide powerful stat bonuses in socketed items and craft jewelry.',
    'Inscription': 'Create glyphs that enhance abilities, as well as scrolls, cards, and off-hand items using milled herbs.',
  };
  return descriptions[profession] || 'Select a profession to see its description.';
}
