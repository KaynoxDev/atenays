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
              
              {/* Mise en valeur de la quantité produite */}
              <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-800">Quantité produite:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-base px-3">
                    {material.barCrafting.outputQuantity || 1} {material.name} par craft
                  </Badge>
                </div>
              </div>
              
              {/* Afficher les alternatives de craft si elles existent */}
              {material.barCrafting.craftAlternatives && material.barCrafting.craftAlternatives.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-blue-700">Options de craft disponibles:</h4>
                  
                  {/* Option primaire (par défaut) */}
                  <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Option par défaut</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Recommandée</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Ressource principale */}
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Ressource principale:</span>
                          <Badge variant="outline" className="text-base px-3">
                            {material.barCrafting.primaryResource.quantityPerBar || 1} unités
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {material.barCrafting.primaryResource.iconName && (
                            <img
                              src={`https://wow.zamimg.com/images/wow/icons/small/${material.barCrafting.primaryResource.iconName.toLowerCase()}.jpg`}
                              alt={material.barCrafting.primaryResource.name}
                              className="w-6 h-6 rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                              }}
                            />
                          )}
                          <span>{material.barCrafting.primaryResource.name}</span>
                        </div>
                      </div>
                      
                      {/* Ressource secondaire si présente */}
                      {material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource && (
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Ressource secondaire:</span>
                            <Badge variant="outline" className="text-base px-3">
                              {material.barCrafting.secondaryResource.quantityPerBar || 1} unités
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {material.barCrafting.secondaryResource.iconName && (
                              <img
                                src={`https://wow.zamimg.com/images/wow/icons/small/${material.barCrafting.secondaryResource.iconName.toLowerCase()}.jpg`}
                                alt={material.barCrafting.secondaryResource.name}
                                className="w-6 h-6 rounded"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                }}
                              />
                            )}
                            <span>{material.barCrafting.secondaryResource.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Alternatives de craft */}
                  {material.barCrafting.craftAlternatives.map((alternative, index) => (
                    <div key={index} className="p-3 bg-gray-50/70 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Alternative {index + 1}</span>
                        {alternative.isPreferred && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Alternative préférée</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {/* Ressource principale alternative */}
                        <div className="p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Ressource principale:</span>
                            <Badge variant="outline" className="text-base px-3">
                              {alternative.primaryResource.quantityPerBar || 1} unités
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {alternative.primaryResource.iconName && (
                              <img
                                src={`https://wow.zamimg.com/images/wow/icons/small/${alternative.primaryResource.iconName.toLowerCase()}.jpg`}
                                alt={alternative.primaryResource.name}
                                className="w-6 h-6 rounded"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                }}
                              />
                            )}
                            <span>{alternative.primaryResource.name}</span>
                          </div>
                        </div>
                        
                        {/* Ressource secondaire alternative si présente */}
                        {alternative.hasSecondaryResource && alternative.secondaryResource && (
                          <div className="p-3 bg-white rounded-md border border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Ressource secondaire:</span>
                              <Badge variant="outline" className="text-base px-3">
                                {alternative.secondaryResource.quantityPerBar || 1} unités
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {alternative.secondaryResource.iconName && (
                                <img
                                  src={`https://wow.zamimg.com/images/wow/icons/small/${alternative.secondaryResource.iconName.toLowerCase()}.jpg`}
                                  alt={alternative.secondaryResource.name}
                                  className="w-6 h-6 rounded"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                                  }}
                                />
                              )}
                              <span>{alternative.secondaryResource.name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Version précédente avec une seule option de craft
                <div className="grid grid-cols-1 gap-3">
                  {material.barCrafting.primaryResource && (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Ressource principale:</span>
                        <Badge variant="outline" className="text-base px-3">
                          {material.barCrafting.primaryResource.quantityPerBar || 1} unités
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {material.barCrafting.primaryResource.iconName && (
                          <img
                            src={`https://wow.zamimg.com/images/wow/icons/small/${material.barCrafting.primaryResource.iconName.toLowerCase()}.jpg`}
                            alt={material.barCrafting.primaryResource.name}
                            className="w-6 h-6 rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                            }}
                          />
                        )}
                        <span>{material.barCrafting.primaryResource.name}</span>
                      </div>
                    </div>
                  )}
                  
                  {material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource && (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Ressource secondaire:</span>
                        <Badge variant="outline" className="text-base px-3">
                          {material.barCrafting.secondaryResource.quantityPerBar || 1} unités
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {material.barCrafting.secondaryResource.iconName && (
                          <img
                            src={`https://wow.zamimg.com/images/wow/icons/small/${material.barCrafting.secondaryResource.iconName.toLowerCase()}.jpg`}
                            alt={material.barCrafting.secondaryResource.name}
                            className="w-6 h-6 rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
                            }}
                          />
                        )}
                        <span>{material.barCrafting.secondaryResource.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Résumé de la recette */}
              <div className="mt-4 p-3 bg-green-50 rounded-md text-sm border border-green-100">
                <div className="font-medium text-green-800 mb-1">Résumé de la recette:</div>
                <div className="flex items-center gap-1 text-green-700">
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-white mr-1">
                      {material.barCrafting.primaryResource.quantityPerBar || 1}
                    </Badge>
                    {material.barCrafting.primaryResource.name}
                  </div>
                  
                  {material.barCrafting.hasSecondaryResource && material.barCrafting.secondaryResource && (
                    <>
                      <span>+</span>
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-white mr-1">
                          {material.barCrafting.secondaryResource.quantityPerBar || 1}
                        </Badge>
                        {material.barCrafting.secondaryResource.name}
                      </div>
                    </>
                  )}
                  
                  <span>=</span>
                  <div className="flex items-center font-bold">
                    <Badge className="bg-green-200 text-green-800 border-green-300 mr-1">
                      {material.barCrafting.outputQuantity || 1}
                    </Badge>
                    {material.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
