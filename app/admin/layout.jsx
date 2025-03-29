'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { BarChart3, Database, Package, Settings, User, FileText, Home, Briefcase, Tag } from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  
  const adminNavItems = [
    { name: 'Vue d\'ensemble', href: '/admin', icon: <Home className="w-5 h-5" /> },
    { name: 'Matériaux', href: '/admin/materials', icon: <Package className="w-5 h-5" /> },
    { name: 'Catégories', href: '/admin/material-categories', icon: <Tag className="w-5 h-5" /> },
    { name: 'Professions', href: '/admin/professions', icon: <Briefcase className="w-5 h-5" /> },
    { name: 'Statistiques', href: '/admin/stats', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Base de données', href: '/admin/database', icon: <Database className="w-5 h-5" /> },
    { name: 'Paramètres', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
    { name: 'Utilisateurs', href: '/admin/users', icon: <User className="w-5 h-5" />, soon: true },
    { name: 'Logs', href: '/admin/logs', icon: <FileText className="w-5 h-5" />, soon: true },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <nav className="flex items-center border rounded-lg mb-6 overflow-hidden overflow-x-auto">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.soon ? '#' : item.href}
              className={cn(
                "flex items-center gap-2 py-3 px-4 border-r last:border-r-0 transition-colors whitespace-nowrap",
                isActive(item.href) 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted",
                item.soon && "opacity-50 cursor-not-allowed"
              )}
              onClick={e => item.soon && e.preventDefault()}
            >
              {item.icon}
              <span className="hidden md:inline">{item.name}</span>
              {item.soon && <span className="text-xs bg-muted-foreground/20 px-1 py-0.5 rounded text-muted-foreground">Bientôt</span>}
            </Link>
          ))}
        </nav>
      </div>
      
      {children}
    </div>
  );
}
