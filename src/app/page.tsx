'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, User, Send, ExternalLink, MessageSquarePlus, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { getAnswer } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export const __SOURCES_DELIMITER__ = '__SOURCES_DELIMITER__';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  sources?: string[];
};

const formSchema = z.object({
  question: z.string().min(1, 'Please enter a question.'),
});

const UserMessage = ({ content }: { content: string }) => (
  <div className="flex items-start gap-3 justify-end">
    <div className="max-w-xl w-full space-y-2">
      <div className="bg-primary/10 border border-primary/20 text-foreground p-3 rounded-xl rounded-br-none">
        <p className="text-sm">{content}</p>
      </div>
    </div>
    <Avatar className="h-8 w-8 border-2 border-primary/50">
      <AvatarFallback className="bg-transparent">
        <User className="h-4 w-4 text-primary" />
      </AvatarFallback>
    </Avatar>
  </div>
);

const AssistantMessage = ({ content, sources }: { content: string, sources?: string[] }) => (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 border-2 border-accent/50">
        <AvatarFallback className="bg-transparent">
          <Bot className="h-4 w-4 text-accent" />
        </AvatarFallback>
      </Avatar>
      <div className="max-w-xl w-full space-y-4">
        <div className="bg-accent/10 p-3 rounded-xl rounded-bl-none border border-accent/20">
            <div className="prose prose-sm prose-invert max-w-none text-foreground">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
            {sources && sources.length > 0 && (
            <div>
                <Separator className="my-4" />
                <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sources</h3>
                <div className="flex flex-wrap gap-2">
                    {sources.map((source, index) => (
                    <a
                        key={index}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                    >
                        <ExternalLink className="h-3 w-3" />
                        {new URL(source).hostname}
                    </a>
                    ))}
                </div>
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
  
const ErrorMessage = ({ content }: { content: string }) => (
    <div className="flex items-start gap-4">
      <Avatar className="h-8 w-8 border bg-destructive text-destructive-foreground">
        <AvatarFallback className="bg-destructive text-destructive-foreground">
            <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <p className="font-semibold text-destructive">Error</p>
        <div className="prose prose-sm max-w-none text-destructive">
            <p>{content}</p>
        </div>
      </div>
    </div>
);

const LoadingMessage = () => (
  <div className="flex items-start gap-3">
    <Avatar className="h-8 w-8 border-2 border-accent/50">
      <AvatarFallback className="bg-transparent">
          <Bot className="h-4 w-4 text-accent" />
      </AvatarFallback>
    </Avatar>
    <div className="max-w-xl w-full space-y-2">
      <div className="bg-accent/10 p-3 rounded-xl rounded-bl-none border border-accent/20">
        <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
    </div>
  </div>
);

const examplePrompts = [
    'Explain quantum computing in simple terms.',
    'Give me 10 ideas for a new SaaS application.',
    'Write a python script to organize my downloads folder.',
    'What are the core principles of functional programming?',
];

export default function Home() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  const handlePrompt = (prompt: string) => {
    form.setValue('question', prompt);
    form.handleSubmit(onSubmit)();
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const question = data.question;
    form.reset();
    
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: question },
      { id: crypto.randomUUID(), role: 'assistant', content: '' } // Add empty assistant message
    ]);

    startTransition(async () => {
      try {
        const answer = await getAnswer(question);
        
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === prev.length - 1 ? { ...msg, content: answer } : msg
          )
        );

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { id: crypto.randomUUID(), role: 'error', content: errorMessage }
        ]);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
      }
    });
  };

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTo({
        top: scrollAreaViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <SidebarProvider>
        <div className="flex h-svh w-full bg-background">
            <Sidebar collapsible="icon" className="border-r-0 md:bg-card/50 backdrop-blur-sm md:border-r">
                <SidebarHeader>
                  <Button variant="ghost" className="w-full justify-start h-10">
                    <MessageSquarePlus className="mr-2" />
                    New Chat
                  </Button>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    {/* Chat History would go here */}
                </SidebarContent>
            </Sidebar>

            <div className="flex flex-1 flex-col h-svh bg-background/95 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
                <header className="flex items-center gap-3 border-b bg-card/50 backdrop-blur-sm p-4 h-16">
                    <SidebarTrigger className="md:hidden"/>
                    <h1 className="text-lg font-semibold tracking-tight">
                        freechat tutor
                    </h1>
                </header>
                
                <main className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full" viewportRef={scrollAreaViewportRef}>
                        <div className="mx-auto max-w-3xl p-4 md:p-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-14rem)]">
                                <Card className="w-full max-w-2xl text-center shadow-none border-0 bg-transparent">
                                    <CardHeader className="gap-2">
                                        <div className="flex justify-center">
                                            <Avatar className="h-16 w-16 border-2 border-accent/20 bg-transparent">
                                                <AvatarFallback className="bg-transparent">
                                                    <Code className="h-8 w-8 text-accent" />
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <CardTitle className="text-3xl font-bold">freechat tutor</CardTitle>
                                        <CardDescription>Your personal AI programming assistant. Ask me anything!</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {examplePrompts.map((prompt) => (
                                                <Button 
                                                    key={prompt}
                                                    variant="outline"
                                                    className="text-left justify-start h-auto py-3 px-4 font-normal bg-card/50 hover:bg-card"
                                                    onClick={() => handlePrompt(prompt)}
                                                >
                                                    {prompt}
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                        <div className="space-y-6">
                            {messages.map((message) => {
                                if (message.role === 'user') {
                                    return <UserMessage key={message.id} content={message.content} />;
                                }
                                if (message.role === 'assistant') {
                                  // Don't render empty assistant messages
                                  if (message.content === '') {
                                    return <LoadingMessage key={message.id} />;
                                  }
                                  return (
                                    <AssistantMessage
                                      key={message.id}
                                      content={message.content}
                                      sources={message.sources}
                                    />
                                  );
                                }
                                if (message.role === 'error') {
                                    return <ErrorMessage key={message.id} content={message.content} />;
                                }
                                return null;
                            })}
                        </div>
                        )}
                        </div>
                    </ScrollArea>
                </main>

                <footer className="bg-card/50 backdrop-blur-sm border-t p-4">
                    <div className="mx-auto max-w-3xl">
                    <Form {...form}>
                        <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="relative"
                        >
                        <FormField
                            control={form.control}
                            name="question"
                            render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                <Input
                                    placeholder="Ask me anything..."
                                    autoComplete="off"
                                    disabled={isPending}
                                    {...field}
                                    className="pr-12 h-12 bg-input rounded-full"
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" size="icon" disabled={isPending} className="absolute top-1/2 right-2 -translate-y-1/2 h-9 w-9 rounded-full bg-accent hover:bg-accent/90">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                        </form>
                    </Form>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                        Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"><span className="text-xs">⌘</span>B</kbd> to toggle the sidebar.
                    </p>
                    </div>
                </footer>
            </div>
        </div>
    </SidebarProvider>
  );
}

    