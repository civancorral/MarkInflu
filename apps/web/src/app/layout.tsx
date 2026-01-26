import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

import '@/styles/globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: {
    default: 'MarkInflu - Influencer Marketing Platform',
    template: '%s | MarkInflu',
  },
  description:
    'Connect brands with creators. Manage campaigns, contracts, and payments in one place.',
  keywords: [
    'influencer marketing',
    'creator economy',
    'brand partnerships',
    'social media marketing',
    'content creators',
  ],
  authors: [{ name: 'MarkInflu' }],
  creator: 'MarkInflu',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://markinflu.com',
    title: 'MarkInflu - Influencer Marketing Platform',
    description:
      'Connect brands with creators. Manage campaigns, contracts, and payments in one place.',
    siteName: 'MarkInflu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarkInflu - Influencer Marketing Platform',
    description:
      'Connect brands with creators. Manage campaigns, contracts, and payments in one place.',
    creator: '@markinflu',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
