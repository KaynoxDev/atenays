'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Essayer de récupérer l'utilisateur actuel
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Bienvenue sur Aténays</CardTitle>
          <CardDescription>Votre outil de gestion de commandes pour World of Warcraft</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Vérification de l'authentification...</p>
          ) : user ? (
            <div>
              <p>Vous êtes connecté en tant que: <strong>{user.username}</strong></p>
              <p>Rôle: <strong>{user.role}</strong></p>
            </div>
          ) : (
            <p>Vous n'êtes pas connecté. Veuillez vous <Link href="/login" className="text-primary hover:underline">connecter</Link>.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {user && (
            <>
              <Link href="/dashboard">
                <Button>Accéder au tableau de bord</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>Se déconnecter</Button>
            </>
          )}
          {!user && !loading && (
            <Link href="/login">
              <Button>Se connecter</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
