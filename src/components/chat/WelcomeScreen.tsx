
'use client';

import { Button } from '@/components/ui/button';

const examplePrompts = [
    'Explain the theory of relativity like I am five',
    '/imagine a holographic brain visualizing complex data',
    'What is quantum computing?',
    '/quiz me on advanced javascript concepts',
];

interface WelcomeScreenProps {
    onPromptClick: (prompt: string) => void;
}

export function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-4">
                <div className="inline-block p-4 rounded-full bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" className="h-12 w-12"><path d="M3 12h2.5l1.5-3 3 6 3-6 1.5 3H19"/></svg>
                </div>
                <h2 className="mt-6 text-3xl font-heading font-medium tracking-tight">Meet FreeChat</h2>
                <p className="mt-2 text-muted-foreground">The AI Tutor That Learns With You</p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm max-w-xl mx-auto">
                    {examplePrompts.map(prompt => (
                        <Button 
                            key={prompt} 
                            variant="outline" 
                            className="text-left justify-start h-auto py-3 px-4 bg-background/50 hover:bg-muted/50 border-input pointer-events-auto"
                            onClick={() => onPromptClick(prompt)}
                        >
                            {prompt.startsWith('/') ? <span className="text-primary mr-2">{prompt.split(' ')[0]}</span> : null}
                            {prompt.startsWith('/') ? prompt.substring(prompt.indexOf(' ') + 1) : prompt}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}

    