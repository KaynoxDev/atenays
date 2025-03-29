import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine et fusionne les noms de classes avec tailwind-merge
 * @param {string[]} inputs - Noms de classes à combiner
 * @returns {string} - Noms de classes fusionnés
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Force le thème clair pour résoudre les problèmes de couleurs
export function forceTheme(theme = 'light') {
  if (typeof window !== 'undefined') {
    const htmlElement = document.documentElement;
    
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    // Store the preference
    localStorage.setItem('theme', theme);
  }
}
