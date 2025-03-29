import './globals.css';
import { Inter, Roboto } from 'next/font/google';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import ClientLayout from '@/components/ClientLayout';
import AccessibilityWidget from '@/components/ui/accessibility-widget';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto'
});

export const metadata = {
  title: 'Aténays - WoW Profession Manager',
  description: 'Application de gestion des professions de World of Warcraft',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${roboto.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider defaultTheme="light">
          <ClientLayout>{children}</ClientLayout>
          <AccessibilityWidget />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
