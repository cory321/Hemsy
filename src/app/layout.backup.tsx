import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hemsy - Seamstress Business Management',
  description:
    'Business Management App for seamstresses and tailoring businesses',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#605143',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Optional ClerkProvider for development - will need env vars in production
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <body className={inter.className}>
        {hasClerkKey ? (
          <ClerkProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ClerkProvider>
        ) : (
          <ThemeProvider>{children}</ThemeProvider>
        )}
      </body>
    </html>
  );
}
