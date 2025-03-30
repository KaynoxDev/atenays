import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MaterialDetails({ material }) {
  if (!material) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {material.iconName && (
            <img
              src={`https://wow.zamimg.com/images/wow/icons/medium/${material.iconName.toLowerCase()}.jpg`}
              alt={material.name}
              className="w-8 h-8 rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg';
              }}
            />
          )}
          {material.name}
          {material.isBar && (
            <Badge variant="outline">Craftable</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Détails de base */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-medium">Profession:</div>
            <div>{material.profession || 'Aucune'}</div>
            <div className="font-medium">Niveau:</div>
            <div>1-{material.levelRange || '525'}</div>
          </div>
          
          {/* Détails de fabrication pour les matériaux craftables */}
          {material.isBar && material.barCrafting && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-2">Informations de craft</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Quantité produite:</div>
                <div>{material.barCrafting.outputQuantity || 1} par craft</div>
                
                {material.barCrafting.primaryResource && (
                  <>
                    <div className="font-medium">Ressource principale:</div>
                    <div className="flex items-center gap-1">
                      {material.barCrafting.primaryResource.iconName && (
                        <img
                          src={`https://wow.zamimg.com/images/wow/icons/small/${material.barCrafting.primaryResource.iconName.toLowerCase()}.jpg`}
                          alt={material.barCrafting.primaryResource.name}
                          className="w-4 h-4 rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                          }}
                        />
                      )}
                      {material.barCrafting.primaryResource.quantityPerBar || 1}x {material.barCrafting.primaryResource.name}
                    </div>
                  </>
                )}
                
                {material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource && (
                  <>
                    <div className="font-medium">Ressource secondaire:</div>
                    <div className="flex items-center gap-1">
                      {material.barCrafting.secondaryResource.iconName && (
                        <img
                          src={`https://wow.zamimg.com/images/wow/icons/small/${material.barCrafting.secondaryResource.iconName.toLowerCase()}.jpg`}
                          alt={material.barCrafting.secondaryResource.name}
                          className="w-4 h-4 rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                          }}
                        />
                      )}
                      {material.barCrafting.secondaryResource.quantityPerBar || 1}x {material.barCrafting.secondaryResource.name}
                    </div>
                  </>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                Pour chaque craft: 
                {material.barCrafting.primaryResource && `${material.barCrafting.primaryResource.quantityPerBar || 1}x ${material.barCrafting.primaryResource.name}`}
                {material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource && 
                  ` + ${material.barCrafting.secondaryResource.quantityPerBar || 1}x ${material.barCrafting.secondaryResource.name}`} 
                = {material.barCrafting.outputQuantity || 1}x {material.name}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
