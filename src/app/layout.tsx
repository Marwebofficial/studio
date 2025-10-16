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
        <link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIQSURBVHhe7Zq/SgNREMaHCSzE2FpprQT/kFaCF7DQyioo9A+sNPoD4gsIeAdTyUpBEFsoWIggWPgHiIXYGgsx2aRkcfjczc3O7nZ3UDBwz+W9fN+T3S0XFxcXFxf/dwCq9yO+bATYIggghgACiCGAAHIIIIAcAggghwACyCGAAHIIIIAcAggghwACyCGAAHIIIIAcAggghwACyCEAgZwJ4HeA9wDeAfxK+S0i8BcA/t1I3IuIfQB/AdxJ8hJAFgI0M/2yIeNTAO8A/AcQX8+yB1jT/0aAxwBuBvgEIFu+f2xQ/85hA/YvgM8AvAEQfGgJUmxAX4CWh20A/BHgEcDqg/KzU5H9TQI8BfC4i3bM0Q/wHMBfAWzP7rUn89fAZwD+AvBfgO+N+3k20L/1l88AnAGYIuISwM+A/wEc9gC/AbwG8G1gZXIAXwE8yTIn5S8AfgRwK0A6/iL43dIeQDYfcG8J4G5AQdgrgFdO1v8D+APAgQD/FQCfAfgZIN07/xJ89q2tAWQfE+85SrmwA/4WwN2AlC0DwK/K/wGcCvBbAAnj7f8v+A/A3wAsBPh3Ifjh2g4gOzaG6b+t8o8c2gL847Gug/p3bAUg+xfA2wBfBOAnAD8C/BHAGcBPAG8BuBHg+g2kAbIIIIAYAggghwACyCGAAHIIIIAcAggghwACyCGAAHIIIIAcAggghwACyCGAAHIIIIAcAggghwACyCEAgZwzPBkXFxcX/3P+A+y/FbxW/15+AAAAAElFTkSuQmCC"/>
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
