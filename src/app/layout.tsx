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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http:/content://com.android.chrome.FileProvider/images/screenshot/17606155299051139683648.png'/>
        </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
