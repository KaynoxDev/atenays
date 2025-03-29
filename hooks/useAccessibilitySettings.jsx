'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useAccessibilitySettings() {
  const [settings, setSettings] = useState({
    darkMode: true,
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
    colorMode: 'default',
  });
  
  const { toast } = useToast();
  
  // Use a flag to prevent multiple state updates during initialization
  const [initialized, setInitialized] = useState(false);
  
  // Charger les paramètres depuis localStorage
  useEffect(() => {
    try {
      // Only run this initialization once
      if (initialized) return;
      
      const savedSettings = localStorage.getItem('accessibilitySettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      }
      
      // Apply the settings without triggering another state update
      if (savedSettings) {
        applySettings(JSON.parse(savedSettings));
      } else {
        applySettings(settings);
      }
      
      setInitialized(true);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres d\'accessibilité:', error);
    }
  }, [initialized]);
  
  // Fonctions d'application des paramètres au DOM
  const applySettings = useCallback((currentSettings) => {
    // Mode sombre
    if (currentSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Contraste élevé
    if (currentSettings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Taille de police
    document.documentElement.dataset.fontSize = currentSettings.fontSize;
    
    // Réduire les animations
    if (currentSettings.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
    
    // Mode de couleur
    document.documentElement.dataset.colorMode = currentSettings.colorMode;
  }, []);
  
  // Apply settings when they change, but only after initial load
  useEffect(() => {
    if (!initialized) return;
    applySettings(settings);
  }, [settings, initialized, applySettings]);
  
  // Mettre à jour un paramètre
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
      return newSettings;
    });
    
    // Avoid showing toast during initialization
    if (initialized) {
      toast({
        title: "Paramètre mis à jour",
        description: `Le paramètre ${key} a été mis à jour.`,
        duration: 2000,
      });
    }
  }, [toast, initialized]);
  
  // Raccourcis pour les paramètres courants - use useCallback to prevent new function references each render
  const toggleDarkMode = useCallback(() => updateSetting('darkMode', !settings.darkMode), [settings.darkMode, updateSetting]);
  const toggleHighContrast = useCallback(() => updateSetting('highContrast', !settings.highContrast), [settings.highContrast, updateSetting]);
  const setFontSize = useCallback((size) => updateSetting('fontSize', size), [updateSetting]);
  const toggleReducedMotion = useCallback(() => updateSetting('reducedMotion', !settings.reducedMotion), [settings.reducedMotion, updateSetting]);
  
  return {
    settings,
    updateSetting,
    toggleDarkMode,
    toggleHighContrast,
    setFontSize,
    toggleReducedMotion,
  };
}
