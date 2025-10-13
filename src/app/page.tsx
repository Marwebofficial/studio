'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, User, Send, Code, MessageSquarePlus, Paperclip, X, Trash, FileText, Loader, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { format } from 'date-fns';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { getAnswer, speak } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_CHAT_HISTORY = 8;

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string | React.ReactNode;
  fileDataUri?: string;
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

const UserMessage = ({ content, fileDataUri, createdAt }: { content: string, fileDataUri?: string, createdAt: Date }) => {
    const isImage = fileDataUri?.startsWith('data:image');
    return (
        <div className="flex items-start gap-3 justify-end">
          <div className="max-w-xl w-full space-y-2">
            <div className="bg-primary/10 border border-primary/20 text-foreground p-3 rounded-xl rounded-br-none">
              {fileDataUri && isImage && (
                <Image 
                  src={fileDataUri} 
                  alt="User upload" 
                  width={200}
                  height={200}
                  className="rounded-lg mb-2 w-full"
                />
              )}
              {fileDataUri && !isImage && (
                <div className="mb-2 flex items-center gap-2 text-sm text-foreground/80">
                    <FileText className="h-4 w-4" />
                    <span>Attached file</span>
                </div>
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
}
  

const AssistantMessage = ({ content }: { content: React.ReactNode | string }) => {
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
  
    const handleSpeak = async () => {
      if (audio) {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          audio.play();
        }
        return;
      }
  
      if (typeof content !== 'string' || content.length === 0) return;
  
      setIsGenerating(true);
      const { media, error } = await speak(content);
      setIsGenerating(false);
  
      if (error) {
          console.error('Error generating speech:', error);
          return;
      }
  
      if (media) {
          const newAudio = new Audio(media);
          newAudio.onplay = () => setIsPlaying(true);
          newAudio.onpause = () => setIsPlaying(false);
          newAudio.onended = () => setIsPlaying(false);
          setAudio(newAudio);
          newAudio.play();
      }
    };
    
      return (
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 border-2 border-accent/50">
            <AvatarFallback className="bg-transparent">
              <Bot className="h-4 w-4 text-accent" />
            </AvatarFallback>
          </Avatar>
          <div className="max-w-xl w-full space-y-2">
              <div className="bg-accent/10 p-3 rounded-xl rounded-bl-none border border-accent/20 group relative">
                  <div className="prose prose-sm prose-invert max-w-none text-foreground pb-6">
                      {typeof content === 'string' ? <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{content}</ReactMarkdown> : content}
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={handleSpeak} 
                    disabled={isGenerating}
                    className="h-7 w-7 absolute bottom-1 right-1"
                  >
                    {isGenerating ? <Loader className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
              </div>
          </div>
        </div>
      );
    };
  
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
      <div className="max-w-xl w-full space-y-4">
        <div className="bg-accent/10 p-3 rounded-xl rounded-bl-none border border-accent/20">
            <div className="space-y-2">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/6" />
            </div>
        </div>
      </div>
    </div>
);

const examplePrompts = [
    'Give me a practice essay question for a history exam on World War II.',
    'What is the capital of Australia?',
    'What are the key strategies for managing time in a written exam?',
    'Explain the concept of "thesis statement" for an argumentative essay.',
];

export default function Home() {
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    const loadedChats = savedChats ? JSON.parse(savedChats, (key, value) => {
        if (key === 'createdAt') return new Date(value);
        return value;
    }) : [];

    const newChat: Chat = {
        id: crypto.randomUUID(),
        messages: [],
        createdAt: new Date(),
    };

    setChats([newChat, ...loadedChats]);
    setActiveChatId(newChat.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Save chats to localStorage whenever they change, but don't save empty new chats
    const chatsToSave = chats.filter(chat => chat.messages.length > 0);
    if (chatsToSave.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chatsToSave));
    } else {
      localStorage.removeItem('chats');
    }
  }, [chats]);
  
  const handleNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      messages: [],
      createdAt: new Date(),
    };
    setChats(prev => {
        const updatedChats = [newChat, ...prev];
        if (updatedChats.length > MAX_CHAT_HISTORY) {
            return updatedChats.slice(0, MAX_CHAT_HISTORY);
        }
        return updatedChats;
    });
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
    if (!currentChatId || (activeChat && activeChat.messages.length > 0)) {
        handleNewChat();
        const newEmptyChat = chats.find(c => c.messages.length === 0);
        currentChatId = newEmptyChat ? newEmptyChat.id : activeChatId;
    }

    setTimeout(() => {
        form.setValue('question', prompt);
        form.handleSubmit((data) => onSubmit(data))();
    }, 0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFileDataUri(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setFileDataUri(undefined);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    let chatId = activeChatId;
    if (!chatId || (activeChat && activeChat.messages.length > 0 && activeChat.messages.some(m=>m.role === 'user'))) {
        const newChat: Chat = { id: crypto.randomUUID(), messages: [], createdAt: new Date() };
        setChats(prev => {
            const updatedChats = [newChat, ...prev];
            if (updatedChats.length > MAX_CHAT_HISTORY) {
                return updatedChats.slice(0, MAX_CHAT_HISTORY);
            }
            return updatedChats;
        });
        chatId = newChat.id;
        setActiveChatId(newChat.id);
    }
    
    if (!chatId) return;

    const question = data.question;
    const currentFileDataUri = fileDataUri;

    form.reset();
    setFileDataUri(undefined);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: question, fileDataUri: currentFileDataUri, createdAt: new Date() };

    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [...chat.messages, userMessage] } 
        : chat
    ));
    
    setIsPending(true);

    try {
      const { answer, error } = await getAnswer(question, currentFileDataUri);
      
      setIsPending(false);

      if (error) {
        throw new Error(error);
      }

      const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: answer, createdAt: new Date() };
      
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage]
          };
        }
        return chat;
      }));


    } catch (error) {
      setIsPending(false);
      const errorMessageContent = error instanceof Error ? error.message : 'An unknown error occurred.';
      const errorMessage: Message = { id: crypto.randomUUID(), role: 'error', content: errorMessageContent, createdAt: new Date() };

      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, errorMessage]
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
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.messages.length === 0) return 'New Chat';
    const firstUserMessage = chat.messages.find(m => m.role === 'user');
    return (firstUserMessage?.content as string) || 'New Chat';
  }
  
  const handleDeleteChat = (chatIdToDelete: string) => {
    const newChats = chats.filter(chat => chat.id !== chatIdToDelete);
    setChats(newChats);

    if (activeChatId === chatIdToDelete) {
        if (newChats.length > 0) {
            setActiveChatId(newChats[0].id);
        } else {
            handleNewChat();
        }
    }
  };

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTo({
        top: scrollAreaViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, activeChatId, isPending]);
  
  const isImageFile = fileDataUri?.startsWith('data:image');

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
                            {chats.filter(c => c.messages.length > 0).map(chat => (
                                <div key={chat.id} className="group relative">
                                  <Button
                                      variant={activeChatId === chat.id ? 'secondary' : 'ghost'}
                                      className="w-full justify-start h-8 text-sm truncate pr-8"
                                      onClick={() => {
                                        setActiveChatId(chat.id);
                                      }}
                                  >
                                      {getChatTitle(chat)}
                                  </Button>
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setChatToDelete(chat.id)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                  </div>
                                </div>
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
                        <div className="mx-auto max-w-3xl px-4 md:px-6">
                        {messages.length === 0 && !isPending ? (
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
                                        <CardDescription>Your personal AI tutor for any question.</CardDescription>
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
                        <div className="space-y-6 pt-6">
                            {messages.map((message) => {
                                if (message.role === 'user') {
                                    return <UserMessage key={message.id} content={message.content as string} fileDataUri={message.fileDataUri} createdAt={message.createdAt} />;
                                }

                                if (message.role === 'assistant') {
                                    return <AssistantMessage key={message.id} content={message.content} />;
                                }
                                if (message.role === 'error') {
                                    return <ErrorMessage key={message.id} content={message.content as string} />;
                                }
                                return null;
                            })}
                            {isPending && <LoadingMessage />}
                        </div>
                        )}
                        </div>
                    </ScrollArea>
                </main>

                <footer className="bg-card/50 backdrop-blur-sm border-t p-4">
                    <div className="mx-auto max-w-3xl">
                    <Form {...form}>
                        <form
                        onSubmit={form.handleSubmit((data) => onSubmit(data))}
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
                                <span className="sr-only">Attach file</span>
                            </Button>
                            <Button type="submit" size="icon" disabled={isPending} className="absolute top-1/2 right-2 -translate-y-1/2 h-9 w-9 rounded-full bg-accent hover:bg-accent/90">
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                          </div>
                          {fileDataUri && (
                            <div className="mt-4 relative w-24 h-24">
                                {isImageFile ? (
                                    <Image src={fileDataUri} alt="Preview" fill objectFit="cover" className="rounded-lg" />
                                ) : (
                                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                                        <FileText className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                )}
                                <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeFile}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                          )}

                          <input type="file" accept="image/*,text/plain,.md" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                          
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
        <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this chat history.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setChatToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            if (chatToDelete) {
                                handleDeleteChat(chatToDelete);
                            }
                            setChatToDelete(null);
                        }}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </SidebarProvider>
  );
}
