'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, User, Send, ExternalLink, MessageSquarePlus, CornerDownLeft } from 'lucide-react';
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
  CardTitle,
  CardDescription
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
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';

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
  <div className="flex items-start gap-4">
    <Avatar className="h-8 w-8 border">
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 space-y-2">
      <p className="font-semibold">You</p>
      <div className="prose prose-sm max-w-none text-foreground">
        <p>{content}</p>
      </div>
    </div>
  </div>
);

const AssistantMessage = ({ content, sources }: { content: string, sources?: string[] }) => (
    <div className="flex items-start gap-4">
      <Avatar className="h-8 w-8 border bg-primary text-primary-foreground">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-4">
        <p className="font-semibold">Web Chat Navigator</p>
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
  <div className="flex items-start gap-4">
    <Avatar className="h-8 w-8 border bg-primary/10 text-primary">
      <AvatarFallback className="bg-transparent text-primary">
        <Bot className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 space-y-2 pt-1.5">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
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
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: question },
    ]);
    form.reset();

    startTransition(async () => {
      const result = await getAnswer(question);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: 'error', content: result.error! },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.answer!,
            sources: result.sources,
          },
        ]);
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
  }, [messages, isPending]);

  return (
    <SidebarProvider>
        <div className="flex h-svh w-full bg-muted/20">
            <Sidebar collapsible="icon" className="border-r-0 md:bg-transparent md:border-r">
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
                <header className="flex items-center gap-3 border-b bg-background p-4 h-16">
                    <SidebarTrigger className="md:hidden"/>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Web Chat Navigator
                    </h1>
                </header>
                
                <main className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full" viewportRef={scrollAreaViewportRef}>
                        <div className="mx-auto max-w-3xl p-4 md:p-8">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-14rem)]">
                                <Card className="w-full max-w-2xl text-center shadow-none border-0">
                                    <CardHeader className="gap-2">
                                        <div className="flex justify-center">
                                            <Avatar className="h-16 w-16 border-2 border-primary/20 bg-background">
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
                                                    className="text-left justify-start h-auto py-3 px-4 font-normal"
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
                        <div className="space-y-8">
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

                <footer className="bg-background border-t p-4">
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
                                    className="pr-12 h-12"
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" size="icon" disabled={isPending} className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 rounded-full">
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
