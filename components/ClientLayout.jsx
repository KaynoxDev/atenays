'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  MoonIcon, SunIcon, HomeIcon, UsersIcon, ShoppingBagIcon, 
  PackageIcon, LayoutDashboardIcon, Settings, Calculator, BellIcon 
} from 'lucide-react';

export default function ClientLayout({ children }) {
  const [darkMode, setDarkMode] = useState(true); // Mode sombre par défaut
  const [currentPath, setCurrentPath] = useState('/');
  
  // Effet pour charger la préférence du mode sombre et le chemin actuel au chargement
  useEffect(() => {
    // Vérifier les préférences utilisateur, mais utiliser le mode sombre par défaut
    const savedMode = localStorage.getItem('darkMode');
    const isDarkMode = savedMode !== null ? savedMode === 'true' : true; // true par défaut
    
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Récupérer le chemin actuel
    setCurrentPath(window.location.pathname);
  }, []);
  
  // Fonction pour basculer le mode sombre
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
    
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const menuItems = [
    { href: '/', label: 'Accueil', icon: <HomeIcon className="w-5 h-5" /> },
    { href: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboardIcon className="w-5 h-5" /> },
    { href: '/clients', label: 'Clients', icon: <UsersIcon className="w-5 h-5" /> },
    { href: '/orders', label: 'Commandes', icon: <ShoppingBagIcon className="w-5 h-5" /> },
    { href: '/materials', label: 'Matériaux', icon: <PackageIcon className="w-5 h-5" /> },
    { href: '/calculator', label: 'Calculateur', icon: <Calculator className="w-5 h-5" /> },
    { href: '/admin', label: 'Admin', icon: <Settings className="w-5 h-5" /> }
  ];
  
  const isActive = (path) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Barre de navigation principale */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-30">
        <div className="container px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl flex items-center gap-2">
              <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-1.5 text-white">
                <PackageIcon className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Aténays
              </span>
            </Link>
            
            {/* Menu desktop */}
            <nav className="hidden md:flex gap-1">
              {menuItems.slice(0, 4).map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${isActive(item.href) 
                      ? 'bg-accent text-accent-foreground' 
                      : 'hover:bg-muted'}
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              title="Notifications"
            >
              <BellIcon className="h-5 w-5" />
            </Button>
            
            {/* Bouton de basculement du mode sombre */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full"
              title={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Barre de navigation latérale et contenu principal */}
      <div className="flex flex-1">
        <aside className="w-16 md:w-56 border-r bg-card shadow-inner hidden sm:block">
          <nav className="flex flex-col py-6 px-2 space-y-1">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  sidebar-link
                  ${isActive(item.href) 
                    ? 'sidebar-link-active' 
                    : 'sidebar-link-inactive'}
                `}
                onClick={() => setCurrentPath(item.href)}
              >
                <span>{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        
        {/* Contenu principal */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
      
      {/* Barre de navigation mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50">
        <nav className="flex justify-between px-6 py-2">
          {menuItems.slice(0, 5).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center p-2 rounded-md transition-colors
                ${isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'}
              `}
              onClick={() => setCurrentPath(item.href)}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
