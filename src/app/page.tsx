'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, User, Send, GraduationCap, MessageSquarePlus, Paperclip, X, Trash, FileText, Loader, Volume2, BookCopy, PlusCircle, Edit, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { format } from 'date-fns';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { getAnswer, speak, getImage } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
  FormLabel,
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
import { useTypingEffect } from '@/hooks/use-typing-effect';

const MAX_CHAT_HISTORY = 8;

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'error' | 'system';
  content: string | React.ReactNode;
  fileDataUri?: string;
  imageUrl?: string;
  createdAt: Date;
};

type Chat = {
  id: string;
  messages: Message[];
  createdAt: Date;
};

type StudentProgram = {
    id: string;
    title: string;
    content?: string;
    fileDataUri?: string;
    fileName?: string;
    createdAt: Date;
};

const formSchema = z.object({
  question: z.string().min(1, 'Please enter a question.'),
});

const settingsFormSchema = z.object({
    title: z.string().min(1, 'Please enter a title.'),
    content: z.string().optional(),
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
  

const AssistantMessage = ({ content, imageUrl }: { content: React.ReactNode | string, imageUrl?: string }) => {
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const displayedContent = useTypingEffect(typeof content === 'string' ? content : '');
  
    const handleSpeak = async () => {
        if (typeof content !== 'string' || content.length === 0) return;
        
        if (audio) {
            if (isPlaying) {
                audio.pause();
                audio.currentTime = 0;
                setIsPlaying(false);
            } else {
                await audio.play();
            }
            return;
        }
  
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
            await newAudio.play();
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
                  {imageUrl && <Image src={imageUrl} alt={typeof content === 'string' ? content : 'Generated image'} width={512} height={512} className="rounded-lg mb-2" />}
                  <div className="prose prose-sm prose-invert max-w-none text-foreground pb-6">
                      {typeof content === 'string' ? <ReactMarkdown remarkPlugins={[[remarkMath, {singleDollarTextMath: true}]]} rehypePlugins={[rehypeKatex]}>{displayedContent}</ReactMarkdown> : content}
                  </div>
                  {typeof content === 'string' && content.length > 0 && (
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleSpeak} 
                        disabled={isGenerating}
                        className="h-7 w-7 absolute bottom-1 right-1"
                    >
                        {isGenerating ? <Loader className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  )}
              </div>
          </div>
        </div>
      );
    };
  
const StudentProgramMessage = ({ programs }: { programs: StudentProgram[] }) => {
    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border-2 border-accent/50">
                <AvatarFallback className="bg-transparent">
                    <BookCopy className="h-4 w-4 text-accent" />
                </AvatarFallback>
            </Avatar>
            <div className="max-w-xl w-full space-y-2">
                <div className="bg-accent/10 p-3 rounded-xl rounded-bl-none border border-accent/20">
                    <div className="prose prose-sm prose-invert max-w-none text-foreground">
                        <h3 className="text-foreground">Student Program Entries</h3>
                        {programs.length > 0 ? (
                            <ul className="space-y-4">
                                {programs.map(program => (
                                    <li key={program.id} className="not-prose">
                                        <Card className="bg-background/50">
                                            <CardHeader>
                                                <CardTitle className="text-base">{program.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {program.content && <p className="text-sm">{program.content}</p>}
                                                {program.fileDataUri && (
                                                    program.fileDataUri.startsWith('data:image') ? (
                                                        <Image src={program.fileDataUri} alt={program.title} width={200} height={200} className="rounded-md mt-2" />
                                                    ) : (
                                                        <div className="mt-2 flex items-center gap-2 text-sm text-foreground/80">
                                                            <FileText className="h-4 w-4" />
                                                            <span>{program.fileName || 'Attached file'}</span>
                                                        </div>
                                                    )
                                                )}
                                            </CardContent>
                                        </Card>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No student program settings have been saved yet. Use the `studentprogramsetting` command to add one.</p>
                        )}
                    </div>
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
    '/imagine a majestic lion in the savanna at sunset',
    'What are the key strategies for managing time in a written exam?',
    'Explain the concept of "thesis statement" for an argumentative essay.',
];

export default function Home() {
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsFileInputRef = useRef<HTMLInputElement>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditProgramOpen, setIsEditProgramOpen] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<StudentProgram | null>(null);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const [studentPrograms, setStudentPrograms] = useState<StudentProgram[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    // Load chats from localStorage
    const savedChats = localStorage.getItem('chats');
    const loadedChats = savedChats ? JSON.parse(savedChats, (key, value) => {
        if (key === 'createdAt') return new Date(value);
        return value;
    }) : [];

    // Load student programs from localStorage
    const savedPrograms = localStorage.getItem('studentPrograms');
    const loadedPrograms = savedPrograms ? JSON.parse(savedPrograms, (key, value) => {
        if (key === 'createdAt') return new Date(value);
        return value;
    }) : [];
    setStudentPrograms(loadedPrograms);

    // Create a new chat and set it as active
    const newChat: Chat = {
        id: crypto.randomUUID(),
        messages: [],
        createdAt: new Date(),
    };

    const updatedChats = [newChat, ...loadedChats];
    setChats(updatedChats);
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

  useEffect(() => {
    localStorage.setItem('studentPrograms', JSON.stringify(studentPrograms));
  }, [studentPrograms]);
  
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
    return newChat.id;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  const settingsForm = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
        title: '',
        content: '',
    },
  });

  const handlePrompt = (prompt: string) => {
    let newChatId = activeChatId;
    if (activeChat && activeChat.messages.length > 0) {
        newChatId = handleNewChat();
    }
    // Use a timeout to ensure the state update for the new chat is processed
    // before we set and submit the form.
    setTimeout(() => {
        setActiveChatId(newChatId);
        form.setValue('question', prompt);
        form.handleSubmit((data) => onSubmit(data))();
    }, 0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, isSettings: boolean = false) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFileDataUri(loadEvent.target?.result as string);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (isSettings: boolean = false) => {
    setFileDataUri(undefined);
    setFileName(undefined);
    const inputRef = isSettings ? settingsFileInputRef : fileInputRef;
    if (inputRef.current) {
        inputRef.current.value = '';
    }
  }

  const handleSaveSettings = async (data: z.infer<typeof settingsFormSchema>) => {
    if (!data.content && !fileDataUri) {
        settingsForm.setError('content', {
            type: 'manual',
            message: 'Please either provide content or upload a file.',
        });
        return;
    }

    if (programToEdit) {
        // Editing existing program
        const updatedProgram: StudentProgram = {
            ...programToEdit,
            title: data.title,
            content: data.content,
            fileDataUri: fileDataUri,
            fileName: fileName,
        };
        setStudentPrograms(prev => prev.map(p => p.id === programToEdit.id ? updatedProgram : p));
        toast({
            title: 'Settings Updated',
            description: `The program "${data.title}" has been updated.`,
        });

    } else {
        // Adding new program
        const newProgram: StudentProgram = {
            id: crypto.randomUUID(),
            title: data.title,
            content: data.content,
            fileDataUri: fileDataUri,
            fileName: fileName,
            createdAt: new Date(),
        };

        setStudentPrograms(prev => [newProgram, ...prev]);
        toast({
            title: 'Settings Saved',
            description: `The program "${data.title}" has been saved.`,
        });
    }
    
    // Reset and close
    settingsForm.reset();
    removeFile(true);
    setIsSettingsOpen(false);
    setProgramToEdit(null);
  };

  const handleEditProgram = (program: StudentProgram) => {
    setProgramToEdit(program);
    settingsForm.setValue('title', program.title);
    settingsForm.setValue('content', program.content || '');
    if (program.fileDataUri) {
        setFileDataUri(program.fileDataUri);
        setFileName(program.fileName);
    }
    setIsEditProgramOpen(false);
    setIsSettingsOpen(true);
  };

  const handleDeleteProgram = (programId: string) => {
    setStudentPrograms(prev => prev.filter(p => p.id !== programId));
    toast({
        title: 'Program Deleted',
        description: 'The program entry has been deleted.',
    });
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const question = data.question;
    const command = question.trim().toLowerCase();
    
    let currentChatId = activeChatId;
    
    // If there's no active chat, or if the active chat is empty and it's not the only chat,
    // create a new one. This handles the initial state and starting new conversations.
    if (!currentChatId || (chats.find(c => c.id === currentChatId)?.messages.length === 0 && chats.length > 1)) {
        const newChat = { id: crypto.randomUUID(), messages: [], createdAt: new Date() };
        currentChatId = newChat.id;
        setChats(prev => [newChat, ...prev.filter(c => c.messages.length > 0)]);
        setActiveChatId(newChat.id);
    }


    if (command === 'studentprogramsetting') {
        setProgramToEdit(null);
        settingsForm.reset();
        removeFile(true);
        setIsSettingsOpen(true);
        form.reset();
        return;
    }

    if (command === 'editstudentprogram') {
        setIsEditProgramOpen(true);
        form.reset();
        return;
    }

    if (command === 'studentprogram') {
        const systemMessage: Message = { 
            id: crypto.randomUUID(), 
            role: 'system', 
            content: <StudentProgramMessage programs={studentPrograms} />, 
            createdAt: new Date() 
        };

        setChats(prev => prev.map(chat =>
            chat.id === currentChatId ? { ...chat, messages: [...chat.messages, systemMessage] } : chat
        ));
        form.reset();
        return;
    }

    const currentFileDataUri = fileDataUri;

    form.reset();
    setFileDataUri(undefined);
    setFileName(undefined);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: question, fileDataUri: currentFileDataUri, createdAt: new Date() };

    setChats(prev => prev.map(chat => 
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, userMessage] } 
        : chat
    ));
    
    setIsPending(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
        if (question.startsWith('/imagine')) {
            const prompt = question.replace('/imagine', '').trim();
            if (!prompt) {
                throw new Error('Please provide a prompt for the image generation.');
            }
            const { imageUrl, error } = await getImage(prompt);

            if (error) throw new Error(error);
            if (!imageUrl) throw new Error('Image generation failed to return an image.');
            
            const imageMessage: Message = { 
                id: crypto.randomUUID(), 
                role: 'assistant', 
                content: `> ${prompt}`,
                imageUrl: imageUrl, 
                createdAt: new Date() 
            };
            
            setChats(prev => prev.map(chat => 
                chat.id === currentChatId 
                  ? { ...chat, messages: [...chat.messages, imageMessage] } 
                  : chat
            ));

        } else {
            const { answer, error } = await getAnswer(question, currentFileDataUri, signal);
            
            if (error) {
              throw new Error(error);
            }
      
            const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: answer, createdAt: new Date() };
            
            setChats(prev => prev.map(chat => {
              if (chat.id === currentChatId) {
                return {
                  ...chat,
                  messages: [...chat.messages, assistantMessage]
                };
              }
              return chat;
            }));
        }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted.');
      } else {
        const errorMessageContent = error instanceof Error ? error.message : 'An unknown error occurred.';
        const errorMessage: Message = { id: crypto.randomUUID(), role: 'error', content: errorMessageContent, createdAt: new Date() };

        setChats(prev => prev.map(chat => {
          if (chat.id === currentChatId) {
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
    } finally {
        setIsPending(false);
        abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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

            <div className="flex flex-1 flex-col h-svh bg-background/95 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-accent/20 to-background bg-[length:200%_200%] animate-background-pan">
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
                                                    <GraduationCap className="h-8 w-8 text-accent" />
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
                        <div className="space-y-6 pt-6 pb-12">
                            {messages.map((message) => {
                                if (message.role === 'user') {
                                    return <UserMessage key={message.id} content={message.content as string} fileDataUri={message.fileDataUri} createdAt={message.createdAt} />;
                                }

                                if (message.role === 'assistant') {
                                    return <AssistantMessage key={message.id} content={message.content} imageUrl={message.imageUrl} />;
                                }
                                if (message.role === 'error') {
                                    return <ErrorMessage key={message.id} content={message.content as string} />;
                                }
                                if (message.role === 'system') {
                                    return message.content;
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
                    {isPending ? (
                      <div className="flex justify-center">
                        <Button variant="outline" onClick={handleStop}>
                            <Square className="mr-2 h-4 w-4" />
                            Stop Generating
                        </Button>
                      </div>
                    ) : (
                      <Form {...form}>
                          <form
                          onSubmit={form.handleSubmit(onSubmit)}
                          className="relative"
                          >
                            <div className="relative">
                              <FormControl>
                                  <Input
                                      placeholder="Ask me anything, or type /imagine to generate an image..."
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
                            {fileDataUri && !isSettingsOpen && (
                              <div className="mt-4 relative w-24 h-24">
                                  {isImageFile ? (
                                      <Image src={fileDataUri} alt="Preview" fill objectFit="cover" className="rounded-lg" />
                                  ) : (
                                      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                                          <FileText className="w-10 h-10 text-muted-foreground" />
                                      </div>
                                  )}
                                  <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeFile()}>
                                      <X className="h-4 w-4" />
                                  </Button>
                              </div>
                            )}

                            <input type="file" accept="image/*,text/plain,.md" ref={fileInputRef} onChange={(e) => handleFileChange(e)} className="hidden" />
                            
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
                    )}
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
        <Dialog open={isSettingsOpen} onOpenChange={(open) => {
            if (!open) {
                setProgramToEdit(null);
                settingsForm.reset();
                removeFile(true);
            }
            setIsSettingsOpen(open);
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(handleSaveSettings)}>
                        <DialogHeader>
                            <DialogTitle>{programToEdit ? 'Edit' : 'Student Program'} Settings</DialogTitle>
                            <DialogDescription>
                                {programToEdit ? 'Edit the' : 'Add a new'} program setting. Provide a title and either type content or upload a file.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <FormField
                                control={settingsForm.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Week 1 Reading" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={settingsForm.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Type your content here..." className="resize-none" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="space-y-2">
                                <Label>Or Upload a File</Label>
                                {fileDataUri ? (
                                    <div className="relative w-24 h-24">
                                        {isImageFile ? (
                                            <Image src={fileDataUri} alt="Preview" fill objectFit="cover" className="rounded-lg" />
                                        ) : (
                                            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                                                <FileText className="w-10 h-10 text-muted-foreground" />
                                            </div>
                                        )}
                                        <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeFile(true)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button type="button" variant="outline" onClick={() => settingsFileInputRef.current?.click()}>
                                        <Paperclip className="mr-2 h-4 w-4" />
                                        Attach File
                                    </Button>
                                )}
                                <input type="file" accept="image/*,text/plain,.md,.pdf,.doc,.docx" ref={settingsFileInputRef} onChange={(e) => handleFileChange(e, true)} className="hidden" />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        <Dialog open={isEditProgramOpen} onOpenChange={setIsEditProgramOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Student Program</DialogTitle>
                    <DialogDescription>
                        Select a program entry to edit or delete it.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4 pr-6">
                        {studentPrograms.length > 0 ? studentPrograms.map(program => (
                             <Card key={program.id} className="flex items-center justify-between p-4">
                                <div>
                                    <p className="font-semibold">{program.title}</p>
                                    <p className="text-sm text-muted-foreground">{program.content?.substring(0, 30) || program.fileName}{'...'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditProgram(program)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setProgramToDelete(program.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">No program entries found.</p>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
         <AlertDialog open={!!programToDelete} onOpenChange={(open) => !open && setProgramToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this program entry.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setProgramToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            if (programToDelete) {
                                handleDeleteProgram(programToDelete);
                            }
                            setProgramToDelete(null);
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

    