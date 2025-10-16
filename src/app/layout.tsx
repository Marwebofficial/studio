import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';

const fontSans = FontSans({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

export const metadata: Metadata = {
  title: 'freechat tutor | Your Personal AI Tutor',
  description: 'Your personal AI tutor for exam prep, homework help, and answering any question. Get instant explanations, practice quizzes, and writing feedback.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><path fill='%23589CFE' d='M50 10L0 40l50 30 50-30L50 10z'/><path fill='%233B82F6' d='M10 45v25l40 20 40-20V45L50 65 10 45z'/></svg>"/>
        </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
