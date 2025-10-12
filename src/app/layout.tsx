import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const fontSans = FontSans({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

export const metadata: Metadata = {
  title: 'Web Chat Navigator',
  description: 'A chatbot that can answer any question from the web.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
