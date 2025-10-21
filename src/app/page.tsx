
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, User, Send, GraduationCap, MessageSquarePlus, Paperclip, X, Trash, FileText, Loader, Volume2, BookCopy, Square, LogOut, Edit, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';


import { getAnswer, speak, getImage, getQuiz } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTypingEffect } from '@/hooks/use-typing-effect';
import { QuizView, type QuizData } from '@/components/quiz';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { Message, Chat } from '@/lib/types';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  question: z.string().trim().min(1, 'Please enter a question.'),
});

const settingsFormSchema = z.object({
    title: z.string().min(1, 'Please enter a title.'),
    content: z.string().optional(),
});

const updateProfileFormSchema = z.object({
    displayName: z.string().min(2, { message: "Name must be at least 2 characters."}),
});


const UserMessage = ({ content, fileDataUri, createdAt, profilePic }: { content: string, fileDataUri?: string, createdAt: string, profilePic: string | null }) => {
    const isImage = fileDataUri?.startsWith('data:image');
    return (
        <div className="flex items-start gap-3 justify-end">
          <div className="max-w-2xl w-full space-y-2">
            <div className="bg-primary/10 border border-primary/20 text-foreground p-3 rounded-xl rounded-br-none backdrop-blur-sm">
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
                {createdAt ? format(new Date(createdAt), 'HH:mm') : ''}
            </div>
          </div>
          <Avatar className="h-8 w-8 border-2 border-primary/50">
            <AvatarImage src={profilePic ?? undefined} alt="User profile picture" />
            <AvatarFallback className="bg-transparent">
              <User className="h-4 w-4 text-primary" />
            </AvatarFallback>
          </Avatar>
        </div>
      );
}
  

const AssistantMessage = ({ message, isLastMessage, isPending }: { message: Message, isLastMessage: boolean, isPending: boolean }) => {
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const content = message.content;
    const isStringContent = typeof content === 'string';
    const isTypingDisabled = !isLastMessage || !!message.quiz || isPending;
    const displayedContent = useTypingEffect(isStringContent ? content : '', isTypingDisabled ? 0 : 10, isTypingDisabled);

    
    const isTyping = isLastMessage && isStringContent && displayedContent.length < content.length && !isPending;

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
        const { media, error } = await speak(content as string);
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
    
    let renderContent: React.ReactNode;
    if (message.quiz) {
      renderContent = <QuizView quiz={message.quiz} />;
    } else if (isStringContent) {
      renderContent = <ReactMarkdown remarkPlugins={[[remarkMath, {singleDollarTextMath: true}]]} rehypePlugins={[rehypeKatex]}>{displayedContent as string}</ReactMarkdown>;
    } else {
      renderContent = message.content;
    }

      return (
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 border-2 border-accent/50">
            <AvatarFallback className="bg-transparent">
              <Bot className="h-4 w-4 text-accent" />
            </AvatarFallback>
          </Avatar>
          <div className="max-w-2xl w-full space-y-2">
              <div className="bg-accent/10 p-3 rounded-xl rounded-bl-none border border-accent/20 group relative backdrop-blur-sm">
                  {message.imageUrl && <Image src={message.imageUrl} alt={typeof content === 'string' ? content : 'Generated image'} width={512} height={512} className="rounded-lg mb-2" />}
                  <div className="prose prose-sm prose-invert max-w-none text-foreground pb-6">
                      {renderContent}
                  </div>
                  <div className="absolute bottom-1 right-1 flex items-center">
                    {isTyping && (
                      <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-7 w-7"
                      >
                          <Square className="h-4 w-4" />
                      </Button>
                    )}
                    {isStringContent && (content as string).length > 0 && !message.quiz && (
                      <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleSpeak} 
                          disabled={isGenerating}
                          className="h-7 w-7"
                      >
                          {isGenerating ? <Loader className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
              </div>
          </div>
        </div>
      );
    };
  
const StudentProgramMessage = ({ programs }: { programs: any[] }) => {
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
      <div className="max-w-2xl w-full space-y-4">
        <div className="bg-accent/10 p-3 rounded-xl rounded-bl-none border border-accent/20 backdrop-blur-sm">
            <div className="space-y-2">
                <Skeleton className="h-4 w-5/6 bg-muted/50" />
                <Skeleton className="h-4 w-full bg-muted/50" />
                <Skeleton className="h-4 w-4/6 bg-muted/50" />
            </div>
        </div>
      </div>
    </div>
);

const examplePrompts = [
    'Explain the theory of relativity',
    '/imagine a futuristic city skyline',
    'What is the capital of Australia?',
    '/quiz me on javascript fundamentals',
];

export default function Home() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isAdmin, isUserLoading } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userData } = useDoc(userDocRef);

  const [activeChatId, setActiveChatId] = useState<string | null>('new');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  const [fileDataUri, setFileDataUri] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditProgramOpen, setIsEditProgramOpen] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<any | null>(null);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const [studentPrograms, setStudentPrograms] = useState<any[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isUpdateProfileOpen, setIsUpdateProfileOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  const settingsForm = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: { title: '', content: '' },
  });

  const updateProfileForm = useForm<z.infer<typeof updateProfileFormSchema>>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: { displayName: '' },
  });

  useEffect(() => {
    if (user && user.displayName) {
        updateProfileForm.setValue('displayName', user.displayName);
    }
  }, [user, updateProfileForm]);

  useEffect(() => {
    if (user && !user.displayName && !isUserLoading && !isUpdateProfileOpen) {
        setIsUpdateProfileOpen(true);
    }
  }, [user, isUserLoading, isUpdateProfileOpen]);

  // Scroll to bottom of chat on new message
  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTo({
        top: scrollAreaViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isPending]);

  useEffect(() => {
    if (userData?.photoURL) {
      setProfilePic(userData.photoURL);
    } else if (user?.photoURL) {
      setProfilePic(user.photoURL);
    }
  }, [user, userData]);


  const chatsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chats'),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);
  const { data: chats, isLoading: isChatsLoading } = useCollection<Chat>(chatsQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !activeChatId || activeChatId === 'new') return null;
    return query(
        collection(firestore, 'users', user.uid, 'chats', activeChatId, 'messages'),
        orderBy('createdAt', 'asc')
    );
  }, [user, activeChatId, firestore]);
  const { data: fetchedMessages, isLoading: isFetchedMessagesLoading } = useCollection<Message>(messagesQuery);

  useEffect(() => {
      if (fetchedMessages) {
          setMessages(fetchedMessages);
      } else if (activeChatId === 'new') {
          setMessages([]);
      }
      setIsMessagesLoading(isFetchedMessagesLoading);
  }, [fetchedMessages, isFetchedMessagesLoading, activeChatId]);


  const handleNewChat = async () => {
    setActiveChatId('new');
    setMessages([]);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;
  
    setChatToDelete(chatId);
  };
  
  const confirmDeleteChat = async () => {
    if (!user || !chatToDelete) return;

    try {
        const chatDocRef = doc(firestore, 'users', user.uid, 'chats', chatToDelete);
        const messagesRef = collection(chatDocRef, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        
        const batch = writeBatch(firestore);
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        batch.delete(chatDocRef);
        await batch.commit();

        toast({
            title: 'Chat Deleted',
            description: 'The chat and all its messages have been removed.',
        });

        if (activeChatId === chatToDelete) {
            handleNewChat();
        }
    } catch (error) {
        console.error("Error deleting chat:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the chat.',
        });
    } finally {
        setChatToDelete(null);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFileDataUri(loadEvent.target?.result as string);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };
  
  const handleSettingsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            settingsForm.setValue('content', loadEvent.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
};

const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({
                variant: 'destructive',
                title: 'Image too large',
                description: 'Please upload an image smaller than 2MB.',
            });
            return;
        }
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const newProfilePic = loadEvent.target?.result as string;
            setProfilePic(newProfilePic);
            if (user) {
                // We only update firestore, as firebase auth has a length limit for photoURL
                updateDoc(doc(firestore, 'users', user.uid), { photoURL: newProfilePic });
            }
        };
        reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
};
  
  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      window.location.href = '/login';
    }
  };

  const handleCommand = async (command: string, ...args: string[]) => {
    const fullCommand = `${command} ${args.join(' ')}`.trim();
    
    let currentChatId = activeChatId;
    if (!user) return;
    
    // Optimistically create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: fullCommand,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);


    if (activeChatId === 'new') {
        const chatsRef = collection(firestore, 'users', user.uid, 'chats');
        const newChat = {
            title: fullCommand.substring(0, 25) + (fullCommand.length > 25 ? '...' : ''),
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(chatsRef, newChat);
        currentChatId = docRef.id;
        setActiveChatId(docRef.id);

        const messagesRef = collection(firestore, 'users', user.uid, 'chats', currentChatId, 'messages');
        await addDoc(messagesRef, { ...userMessage, createdAt: serverTimestamp() });
    } else if (currentChatId) {
        const messagesRef = collection(firestore, 'users', user.uid, 'chats', currentChatId, 'messages');
        await addDoc(messagesRef, { ...userMessage, createdAt: serverTimestamp() });
    }


    if (!currentChatId || currentChatId === 'new') return;
    const messagesRef = collection(firestore, 'users', user.uid, 'chats', currentChatId, 'messages');
    
    setIsPending(true);

    if (command === '/imagine') {
        const prompt = args.join(' ');
        if (!prompt) {
            await addDoc(messagesRef, { role: 'error', content: 'The /imagine command requires a text prompt.', createdAt: serverTimestamp() });
        } else {
            const { imageUrl, error } = await getImage(prompt);
            if (error) {
                await addDoc(messagesRef, { role: 'error', content: error, createdAt: serverTimestamp() });
            } else if (imageUrl) {
                await addDoc(messagesRef, { role: 'assistant', content: `An image generated for: "${prompt}"`, imageUrl: imageUrl, createdAt: serverTimestamp() });
            }
        }
    } else if (command === '/quiz') {
        const topic = args.join(' ');
        if (!topic) {
            await addDoc(messagesRef, { role: 'error', content: 'The /quiz command requires a topic.', createdAt: serverTimestamp() });
        } else {
            const { quiz, error } = await getQuiz(topic);
            if (error) {
                await addDoc(messagesRef, { role: 'error', content: error, createdAt: serverTimestamp() });
            } else if (quiz) {
                await addDoc(messagesRef, { role: 'assistant', content: '', quiz: quiz, createdAt: serverTimestamp() });
            }
        }
    } else {
        await addDoc(messagesRef, { role: 'error', content: `Unknown command: ${command}`, createdAt: serverTimestamp() });
    }
    setIsPending(false);
};

  const onUpdateProfileSubmit = async (values: z.infer<typeof updateProfileFormSchema>) => {
    if (!user) return;
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateProfile(user, { displayName: values.displayName });
        await updateDoc(userDocRef, { displayName: values.displayName });

        toast({
            title: 'Profile Updated',
            description: `Your name has been set to ${values.displayName}.`,
        });
        setIsUpdateProfileOpen(false);
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update your profile.',
        });
    }
  };


  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    if (data.question.startsWith('/')) {
        const [command, ...args] = data.question.split(' ');
        handleCommand(command, ...args);
        form.reset();
        setFileDataUri(undefined);
        setFileName(undefined);
        return;
    }
    
    let currentChatId = activeChatId;
    
    // Create new chat in Firestore if it's the first message
    if (activeChatId === 'new') {
        const chatsRef = collection(firestore, 'users', user.uid, 'chats');
        const newChat = {
            title: data.question.substring(0, 25) + (data.question.length > 25 ? '...' : ''),
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(chatsRef, newChat);
        currentChatId = docRef.id;
        setActiveChatId(docRef.id);
    }

    if (!currentChatId || currentChatId === 'new') return; // Should not happen after the above block

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: data.question,
      createdAt: new Date().toISOString(),
      fileDataUri: fileDataUri
    };
    
    // Optimistically update UI
    setMessages(prev => [...prev, userMessage]);
    form.reset();
    setFileDataUri(undefined);
    setFileName(undefined);

    // Save user message to Firestore
    const messagesRef = collection(firestore, 'users', user.uid, 'chats', currentChatId, 'messages');
    await addDoc(messagesRef, {
        role: 'user',
        content: data.question,
        fileDataUri: fileDataUri || null,
        createdAt: serverTimestamp()
    });


    setIsPending(true);
    
    abortControllerRef.current = new AbortController();
    const { answer, error } = await getAnswer(data.question, fileDataUri, abortControllerRef.current.signal);
    abortControllerRef.current = null;
    
    if (error) {
      await addDoc(messagesRef, { role: 'error', content: error, createdAt: serverTimestamp() });
    } else {
      await addDoc(messagesRef, { role: 'assistant', content: answer, createdAt: serverTimestamp() });
    }
    
    setIsPending(false);
  };
  
  const activeChatTitle = chats?.find(c => c.id === activeChatId)?.title || 'New Chat';

  return (
    <>
    <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] animate-background-pan" />
    <Dialog open={isUpdateProfileOpen} onOpenChange={setIsUpdateProfileOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update Your Profile</DialogTitle>
                <DialogDescription>
                    It looks like you haven't set your name yet. Please enter it below.
                </DialogDescription>
            </DialogHeader>
            <Form {...updateProfileForm}>
                <form onSubmit={updateProfileForm.handleSubmit(onUpdateProfileSubmit)} className="space-y-4">
                    <FormField
                        control={updateProfileForm.control}
                        name="displayName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={updateProfileForm.formState.isSubmitting}>
                            {updateProfileForm.formState.isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
    <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the chat and all of its messages. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setChatToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteChat}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <SidebarProvider>
      <div className="flex h-svh bg-transparent text-foreground">
        <Sidebar className="border-r border-border/20 bg-background/50 backdrop-blur-lg">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <Link href="/" className="inline-block p-1 rounded-full bg-accent/10 border border-accent/20">
                    <GraduationCap className="h-5 w-5 text-accent" />
                </Link>
              <h2 className="text-lg font-semibold tracking-tight">freechat tutor</h2>
            </div>
            <SidebarTrigger className="absolute top-3 right-3" />
          </SidebarHeader>
          <SidebarContent className="p-2 flex flex-col">
            <Button variant="ghost" className="w-full border justify-start" onClick={handleNewChat}>
                <MessageSquarePlus className="mr-2" /> New Chat
            </Button>
            <ScrollArea className="flex-1 my-4">
              <div className="px-2 space-y-1">
                <h3 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider">CHAT HISTORY</h3>
                {isChatsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
                  </div>
                ) : (
                  chats?.map((chat) => (
                    <div key={chat.id} className="group relative">
                      <Button
                          variant="ghost"
                          className={cn("w-full justify-start truncate", activeChatId === chat.id && "bg-accent/20")}
                          onClick={() => handleSelectChat(chat.id)}
                      >
                          {chat.title}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteChat(chat.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-2 space-y-2">
                {user && (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 cursor-pointer" onClick={() => profilePicInputRef.current?.click()}>
                           <AvatarImage src={profilePic ?? undefined} alt="Profile picture" />
                            <AvatarFallback>
                                {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : <User />}
                            </AvatarFallback>
                        </Avatar>
                        <input type="file" accept="image/*" ref={profilePicInputRef} onChange={handleProfilePicUpload} className="hidden" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{user.displayName || 'Anonymous User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsUpdateProfileOpen(true)}><Edit /></Button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    {isAdmin && <Button variant="outline" className="flex-1" asChild><Link href="/admin"><Shield /> Admin</Link></Button>}
                    <Button variant="destructive" className="flex-1" onClick={handleLogout}><LogOut /> Logout</Button>
                </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-svh bg-transparent">
            <header className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-lg md:pl-0">
                <SidebarTrigger className="md:hidden"/>
                <h1 className="text-lg font-semibold tracking-tight truncate flex-1 text-center">
                    {activeChatTitle}
                </h1>
                <div className="w-8" />
            </header>
            <div className="flex-1 relative">
                <ScrollArea className="h-full" viewportRef={scrollAreaViewportRef}>
                    <div className="p-4 md:p-6 space-y-6">
                    {isMessagesLoading ? (
                        <LoadingMessage />
                    ) : (
                        messages?.map((message, index) => {
                        if (message.role === 'user') {
                            return <UserMessage key={message.id} content={message.content as string} fileDataUri={message.fileDataUri} createdAt={message.createdAt?.toString()} profilePic={profilePic} />;
                        }
                        if (message.role === 'assistant') {
                            return <AssistantMessage key={message.id} message={message} isLastMessage={index === messages.length - 1} isPending={isPending} />;
                        }
                        if (message.role === 'system' && message.programs) {
                            return <StudentProgramMessage key={message.id} programs={message.programs} />
                        }
                        if (message.role === 'error') {
                            return <ErrorMessage key={message.id} content={message.content as string} />;
                        }
                        return null;
                        })
                    )}
                    {isPending && <LoadingMessage />}
                    </div>
                </ScrollArea>
                {!messages || messages.length === 0 && !isMessagesLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center p-4">
                            <div className="inline-block p-4 rounded-full bg-accent/10 border border-accent/20">
                                <GraduationCap className="h-12 w-12 text-accent" />
                            </div>
                            <h2 className="mt-6 text-3xl font-semibold tracking-tight">freechat tutor</h2>
                            <p className="mt-2 text-muted-foreground">How can I help you learn today?</p>
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm max-w-md mx-auto">
                                {examplePrompts.map(prompt => (
                                    <Button 
                                        key={prompt} 
                                        variant="outline" 
                                        className="text-left justify-start h-auto py-3 px-4 bg-background/50 hover:bg-muted/50"
                                        onClick={() => form.setValue('question', prompt)}
                                    >
                                        {prompt}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="p-4 border-t bg-background/50 backdrop-blur-lg">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="relative max-w-3xl mx-auto">
                    {fileDataUri && (
                        <div className="absolute bottom-full left-0 mb-2 w-full">
                            <div className="p-2 bg-muted rounded-md flex items-center justify-between gap-2 border">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                                    <FileText className="h-4 w-4" />
                                    <span className="truncate">{fileName}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFileDataUri(undefined); setFileName(undefined);}}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                    <Textarea
                        {...form.register('question')}
                        placeholder="Ask anything or type '/' for commands..."
                        className="pr-28"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                            }
                        }}
                        disabled={isPending}
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPending}
                        >
                            <Paperclip />
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <Button type="submit" size="icon" disabled={isPending}>
                            <Send />
                        </Button>
                    </div>
                </form>
            </Form>
            </footer>
        </main>
      </div>
    </SidebarProvider>
    </>
  );
}

    