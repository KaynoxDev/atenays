'use client';

import { useState, useEffect } from 'react';

export function useUserPreferences() {
  // État local pour suivre les préférences utilisateur
  const [preferences, setPreferences] = useState({
    theme: 'light',
    fontSize: 'medium',
    highContrast: false
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Charger les préférences depuis localStorage et/ou API
  useEffect(() => {
    async function loadPreferences() {
      try {
        // D'abord, essayer de charger depuis localStorage
        const localPrefs = localStorage.getItem('userPreferences');
        if (localPrefs) {
          setPreferences(JSON.parse(localPrefs));
        }
        
        // Ensuite, essayer de synchroniser avec le serveur
        const response = await fetch('/api/user-preferences');
        
        if (response.ok) {
          const serverPrefs = await response.json();
          setPreferences(prev => ({ ...prev, ...serverPrefs }));
          localStorage.setItem('userPreferences', JSON.stringify(serverPrefs));
        }
      } catch (err) {
        // En cas d'erreur, ne pas perturber l'expérience utilisateur
        console.error('Erreur lors du chargement des préférences:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadPreferences();
  }, []);
  
  // Appliquer les préférences au chargement
  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    document.documentElement.dataset.fontSize = preferences.fontSize;
  }, [preferences]);
  
  // Fonction pour mettre à jour les préférences
  const updatePreferences = async (newPrefs) => {
    try {
      const updatedPrefs = { ...preferences, ...newPrefs };
      setPreferences(updatedPrefs);
      
      // Sauvegarder localement
      localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
      
      // Synchroniser avec le serveur
      await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPrefs)
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour des préférences:', err);
      setError(err.message);
    }
  };
  
  return { 
    preferences, 
    updatePreferences, 
    loading, 
    error,
    isDarkMode: preferences.theme === 'dark',
    toggleDarkMode: () => updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' }),
    setFontSize: (size) => updatePreferences({ fontSize: size }),
    toggleHighContrast: () => updatePreferences({ highContrast: !preferences.highContrast })
  };
}
