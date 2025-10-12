'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, User, Send, ExternalLink, MessageSquarePlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { getAnswer } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
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
        <div className="bg-primary text-primary-foreground p-3 rounded-xl rounded-br-none">
            <p className="text-sm">{content}</p>
        </div>
    </div>
    <Avatar className="h-8 w-8 border">
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  </div>
);

const AssistantMessage = ({ content, sources }: { content: string, sources?: string[] }) => (
    <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 border bg-card text-primary">
            <AvatarFallback className="bg-card text-primary">
                <Bot className="h-4 w-4" />
            </AvatarFallback>
        </Avatar>
        <div className="max-w-xl w-full space-y-4">
            <div className="bg-card p-3 rounded-xl rounded-bl-none border">
                <div className="prose prose-sm max-w-none text-foreground">
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
                            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
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
    <Avatar className="h-8 w-8 border bg-card text-primary">
        <AvatarFallback className="bg-card text-primary">
            <Bot className="h-4 w-4" />
        </AvatarFallback>
    </Avatar>
    <div className="max-w-xl w-full space-y-2">
      <div className="bg-card p-3 rounded-xl rounded-bl-none border">
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
    'What are the latest advancements in AI?',
    'Plan a 3-day trip to Paris for a solo traveler on a budget.',
    'Write a short story about a robot who discovers music.',
    'What\'s the weather like in Tokyo tomorrow?',
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
    
    startTransition(async () => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content: question },
      ]);
      const assistantMessageId = crypto.randomUUID();
      
      try {
        const answer = await getAnswer(question);
        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: 'assistant', content: answer },
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setMessages((prev) => [
          ...prev.filter(m => m.id !== assistantMessageId),
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
            <Sidebar collapsible="icon" className="border-r-0 md:bg-card md:border-r">
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

            <div className="flex flex-1 flex-col h-svh">
                <header className="flex items-center gap-3 border-b bg-card p-4 h-16">
                    <SidebarTrigger className="md:hidden"/>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Web Chat Navigator
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
                                            <Avatar className="h-16 w-16 border-2 border-primary/20 bg-card">
                                                <AvatarFallback className="bg-transparent">
                                                    <Bot className="h-8 w-8 text-primary" />
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <CardTitle className="text-2xl">How can I help you today?</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {examplePrompts.map((prompt) => (
                                                <Button 
                                                    key={prompt}
                                                    variant="outline"
                                                    className="text-left justify-start h-auto py-3 px-4 font-normal bg-card"
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
                                    return <AssistantMessage
                                                key={message.id}
                                                content={message.content}
                                                sources={message.sources}
                                            />;
                                }
                                if (message.role === 'error') {
                                    return <ErrorMessage key={message.id} content={message.content} />;
                                }
                                return null;
                            })}
                            {isPending && <LoadingMessage />}
                        </div>
                        )}
                        </div>
                    </ScrollArea>
                </main>

                <footer className="bg-card border-t p-4">
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
                                    className="pr-12 h-12 bg-background rounded-full"
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
