import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import ClientLayout from '@/components/ClientLayout';
import AccessibilityWidget from '@/components/ui/accessibility-widget';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Aténays - WoW Profession Manager',
  description: 'Application de gestion des professions de World of Warcraft',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider defaultTheme="light">
          <ClientLayout>{children}</ClientLayout>
          <AccessibilityWidget />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
