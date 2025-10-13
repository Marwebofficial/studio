'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, User, Send, Code, MessageSquarePlus, Paperclip, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { format } from 'date-fns';

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

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  imageDataUri?: string;
  createdAt: Date;
};

type Chat = {
  id: string;
  messages: Message[];
  createdAt: Date;
};

const formSchema = z.object({
  question: z.string().min(1, 'Please enter a question.'),
});

const UserMessage = ({ content, imageDataUri, createdAt }: { content: string, imageDataUri?: string, createdAt: Date }) => (
    <div className="flex items-start gap-3 justify-end">
      <div className="max-w-xl w-full space-y-2">
        <div className="bg-primary/10 border border-primary/20 text-foreground p-3 rounded-xl rounded-br-none">
          {imageDataUri && (
            <Image 
              src={imageDataUri} 
              alt="User upload" 
              width={200}
              height={200}
              className="rounded-lg mb-2 w-full"
            />
          )}
          <p className="text-sm text-foreground">{content}</p>
        </div>
        <div className="text-xs text-muted-foreground text-right">
            {format(createdAt, 'HH:mm')}
        </div>
      </div>
      <Avatar className="h-8 w-8 border-2 border-primary/50">
        <AvatarFallback className="bg-transparent">
          <User className="h-4 w-4 text-primary" />
        </AvatarFallback>
      </Avatar>
    </div>
  );
  

const AssistantMessage = ({ content }: { content: string }) => (
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
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    // Load chats from localStorage on initial render
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      try {
        const parsedChats: Chat[] = JSON.parse(savedChats, (key, value) => {
          if (key === 'createdAt') {
            return new Date(value);
          }
          return value;
        });
        setChats(parsedChats);
        if (parsedChats.length > 0) {
          setActiveChatId(parsedChats[parsedChats.length - 1].id);
        }
      } catch (e) {
        console.error("Failed to parse chats from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save chats to localStorage whenever they change
    if (chats.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats]);
  
  const handleNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      messages: [],
      createdAt: new Date(),
    };
    setChats(prev => [...prev, newChat]);
    setActiveChatId(newChat.id);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  const handlePrompt = (prompt: string) => {
    let currentChatId = activeChatId;
    if (!currentChatId) {
      const newChat: Chat = {
        id: crypto.randomUUID(),
        messages: [],
        createdAt: new Date(),
      };
      setChats(prev => [...prev, newChat]);
      currentChatId = newChat.id;
      setActiveChatId(newChat.id);
    }
    form.setValue('question', prompt);
    form.handleSubmit((data) => onSubmit(data, currentChatId!))();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImageDataUri(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageDataUri(undefined);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const onSubmit = (data: z.infer<typeof formSchema>, chatId: string) => {
    const question = data.question;
    const currentImageDataUri = imageDataUri;

    form.reset();
    setImageDataUri(undefined);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: question, imageDataUri: currentImageDataUri, createdAt: new Date() };

    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [...chat.messages, userMessage] } 
        : chat
    ));

    startTransition(async () => {
      const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', createdAt: new Date() };
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      ));

      try {
        const answer = await getAnswer(question, currentImageDataUri);
        
        setChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.id === assistantMessage.id ? { ...msg, content: answer } : msg
              )
            };
          }
          return chat;
        }));

      } catch (error) {
        const errorMessageContent = error instanceof Error ? error.message : 'An unknown error occurred.';
        const errorMessage: Message = { id: crypto.randomUUID(), role: 'error', content: errorMessageContent, createdAt: new Date() };

        setChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
            // Replace the loading message with the error message
            return {
              ...chat,
              messages: [
                ...chat.messages.slice(0, -1),
                errorMessage
              ]
            }
          }
          return chat;
        }));

        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessageContent,
        });
      }
    });
  };

  const getChatTitle = (chat: Chat) => {
    const firstUserMessage = chat.messages.find(m => m.role === 'user');
    return firstUserMessage?.content || 'New Chat';
  }

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
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={handleNewChat}>
                    <MessageSquarePlus className="mr-2" />
                    New Chat
                  </Button>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-1 pr-2">
                            {chats.slice().reverse().map(chat => (
                                <Button
                                    key={chat.id}
                                    variant={activeChatId === chat.id ? 'secondary' : 'ghost'}
                                    className="w-full justify-start h-8 text-sm truncate"
                                    onClick={() => setActiveChatId(chat.id)}
                                >
                                    {getChatTitle(chat)}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
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
                                    return <UserMessage key={message.id} content={message.content} imageDataUri={message.imageDataUri} createdAt={message.createdAt} />;
                                }

                                if (message.role === 'assistant') {
                                    if (message.content === '') {
                                        return <LoadingMessage key={message.id} />;
                                    }
                                    return <AssistantMessage key={message.id} content={message.content} />;
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
                        onSubmit={form.handleSubmit((data) => {
                            if (!activeChatId) {
                                const newChat: Chat = { id: crypto.randomUUID(), messages: [], createdAt: new Date() };
                                setChats(prev => [...prev, newChat]);
                                setActiveChatId(newChat.id);
                                onSubmit(data, newChat.id);
                            } else {
                                onSubmit(data, activeChatId);
                            }
                        })}
                        className="relative"
                        >
                          <div className="relative">
                            <FormControl>
                                <Input
                                    placeholder="Ask me anything..."
                                    autoComplete="off"
                                    disabled={isPending}
                                    {...form.register('question')}
                                    className="pr-20 pl-12 h-12 bg-input rounded-full"
                                />
                            </FormControl>
                            <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 left-2 -translate-y-1/2 h-9 w-9 rounded-full" onClick={() => fileInputRef.current?.click()}>
                                <Paperclip className="h-4 w-4" />
                                <span className="sr-only">Attach image</span>
                            </Button>
                            <Button type="submit" size="icon" disabled={isPending} className="absolute top-1/2 right-2 -translate-y-1/2 h-9 w-9 rounded-full bg-accent hover:bg-accent/90">
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                          </div>
                          {imageDataUri && (
                            <div className="mt-4 relative w-24 h-24">
                                <Image src={imageDataUri} alt="Preview" layout="fill" objectFit="cover" className="rounded-lg" />
                                <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                          )}

                          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                          
                          <FormField
                            control={form.control}
                            name="question"
                            render={() => (
                            <FormItem>
                                <FormMessage className="mt-2" />
                            </FormItem>
                            )}
                        />
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
