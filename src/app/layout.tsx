import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { DateLocalizationProvider } from '@/providers/DateLocalizationProvider';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import '../../public/icons/generated-icons.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-sans-rounded',
});

export const metadata: Metadata = {
  title: 'Threadfolio - Seamstress Business Management',
  description: 'Mobile-first PWA for seamstresses and tailoring businesses',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      <body className={`${nunito.variable} ${nunito.className}`}>
        <DateLocalizationProvider>
          {hasClerkKey ? (
            <ClerkProvider>
              <QueryProvider>
                <ThemeProvider>
                  {children}
                  <Toaster
                    position="bottom-center"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#333',
                        color: '#fff',
                      },
                      success: {
                        iconTheme: {
                          primary: '#4caf50',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#f44336',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                </ThemeProvider>
              </QueryProvider>
            </ClerkProvider>
          ) : (
            <QueryProvider>
              <ThemeProvider>
                {children}
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#333',
                      color: '#fff',
                    },
                  }}
                />
              </ThemeProvider>
            </QueryProvider>
          )}
        </DateLocalizationProvider>
      </body>
    </html>
  );
}
