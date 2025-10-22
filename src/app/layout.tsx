import type { Metadata } from 'next';
import { Inter as FontSans, Space_Grotesk as FontHeading } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import { FirebaseClientProvider } from '@/firebase';

const fontSans = FontSans({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

const fontHeading = FontHeading({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'FreeChat — The AI Tutor That Learns With You',
  description: 'Ask anything. Learn everything. Personalized, visual, and conversational.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300ffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M3 12h2.5l1.5-3 3 6 3-6 1.5 3H19'/%3e%3c/svg%3e" />
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable, fontHeading.variable)}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
