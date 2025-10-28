
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc, collection, query, orderBy, addDoc, serverTimestamp, writeBatch, getDocs, Timestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { Message, Chat, RunCodeOutput } from '@/lib/types';
import { getAnswer, getImage, getQuiz } from '@/app/actions';

import { SidebarProvider } from '@/components/ui/sidebar';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { MainHeader } from '@/components/chat/MainHeader';
import { ChatView } from '@/components/chat/ChatView';
import { CodeEditorView } from '@/components/chat/CodeEditorView';
import { UpdateProfileDialog, DeleteChatDialog } from '@/components/chat/Dialogs';

const updateProfileFormSchema = z.object({
    displayName: z.string().min(2, { message: "Name must be at least 2 characters."}),
});

export default function Home() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isAdmin, isUserLoading } = useUser();
  const { data: userData } = useDoc<any>(
    useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore])
  );

  const [view, setView] = useState<'chat' | 'code'>('chat');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, setIsPending] = useState(false);
  
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isUpdateProfileOpen, setIsUpdateProfileOpen] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProfileForm = useForm<z.infer<typeof updateProfileFormSchema>>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: { displayName: '' },
  });

  useEffect(() => {
    if (user) {
        handleNewChat();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.displayName) {
        updateProfileForm.setValue('displayName', user.displayName);
    }
    // Prioritize auth user photoURL, but allow local state to override for session preview
    if (user?.photoURL && !profilePic) {
      setProfilePic(user.photoURL);
    }
  }, [user, userData, updateProfileForm, profilePic]);


  useEffect(() => {
    if (user && !user.displayName && !isUserLoading && !isUpdateProfileOpen) {
        setIsUpdateProfileOpen(true);
    }
  }, [user, isUserLoading, isUpdateProfileOpen]);

  const chatsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chats'),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);
  const { data: chats, isLoading: isChatsLoading } = useCollection<Chat>(chatsQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !activeChatId) return null;
    return query(
        collection(firestore, 'users', user.uid, 'chats', activeChatId, 'messages'),
        orderBy('createdAt', 'asc')
    );
  }, [user, activeChatId, firestore]);
  const { data: fetchedMessages, isLoading: isFetchedMessagesLoading } = useCollection<Message>(messagesQuery);

  useEffect(() => {
      if (fetchedMessages) {
          setMessages(fetchedMessages);
      } else if (!activeChatId) {
          setMessages([]);
      }
      setIsMessagesLoading(isFetchedMessagesLoading);
  }, [fetchedMessages, isFetchedMessagesLoading, activeChatId]);


  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setView('chat');
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
            description: 'The conversation has been removed from history.',
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
  
  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
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
            setProfilePic(newProfilePic); // Set for session preview
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
  
  const onUpdateProfileSubmit = async (values: z.infer<typeof updateProfileFormSchema>) => {
    if (!user) return;
    try {
        // Update auth profile
        await updateProfile(user, { displayName: values.displayName });
        
        // Update firestore document
        const userDocRef = doc(firestore, 'users', user.uid);
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


    if (!activeChatId) {
        const chatsRef = collection(firestore, 'users', user.uid, 'chats');
        const newChat = {
            title: fullCommand.substring(0, 35) + (fullCommand.length > 35 ? '...' : ''),
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


    if (!currentChatId) return;
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
  
  const handleChatSubmit = async (question: string, fileDataUri?: string) => {
    if (!user) return;
    
    if (question.startsWith('/')) {
        const [command, ...args] = question.split(' ');
        handleCommand(command, ...args);
        return;
    }
    
    let currentChatId = activeChatId;
    let isNewChat = false;
    
    if (!activeChatId) {
        isNewChat = true;
        const chatsRef = collection(firestore, 'users', user.uid, 'chats');
        const newChatData = {
            title: question.substring(0, 35) + (question.length > 35 ? '...' : ''),
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(chatsRef, newChatData);
        currentChatId = docRef.id;
        setActiveChatId(docRef.id);
    }

    if (!currentChatId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
      fileDataUri: fileDataUri
    };
    
    const messagesWithUser = isNewChat ? [userMessage] : [...messages, userMessage];
    setMessages(messagesWithUser);

    const messagesRef = collection(firestore, 'users', user.uid, 'chats', currentChatId, 'messages');
    await addDoc(messagesRef, {
        role: 'user',
        content: question,
        fileDataUri: fileDataUri || null,
        createdAt: serverTimestamp()
    });

    setIsPending(true);
    
    const historyForAI = messagesWithUser.slice(0, -1).map((msg): Message => {
        // Create a clean, serializable object for the history
        const cleanMsg: Message = {
          id: msg.id,
          role: msg.role,
          content: msg.content as string, // Ensure content is a string
        };
  
        // Check if createdAt is a Firestore Timestamp and convert it
        if (msg.createdAt && typeof (msg.createdAt as any).toDate === 'function') {
          cleanMsg.createdAt = (msg.createdAt as Timestamp).toDate().toISOString();
        } else if (msg.createdAt) {
          // It might already be a string or Date object
          cleanMsg.createdAt = new Date(msg.createdAt).toISOString();
        }
  
        return cleanMsg;
    });

    abortControllerRef.current = new AbortController();
    const { answer, error } = await getAnswer(question, fileDataUri, historyForAI, abortControllerRef.current.signal);
    abortControllerRef.current = null;
    
    if (error) {
      await addDoc(messagesRef, { role: 'error', content: error, createdAt: serverTimestamp() });
    } else {
      await addDoc(messagesRef, { role: 'assistant', content: answer, createdAt: serverTimestamp() });
    }
    
    setIsPending(false);
  };
  
  const activeChatTitle = chats?.find(c => c.id === activeChatId)?.title || 'New Conversation';
  const headerTitle = view === 'code' ? 'Code Editor' : activeChatTitle;

  return (
    <>
    <div className="fixed inset-0 -z-10 h-full w-full bg-background">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.15),#040b1e00)]" />
      <div className="absolute bottom-0 left-0 z-0 h-1/3 w-full bg-gradient-to-t from-background to-transparent" />
    </div>
    <UpdateProfileDialog
        isOpen={isUpdateProfileOpen}
        onOpenChange={setIsUpdateProfileOpen}
        form={updateProfileForm}
        onSubmit={onUpdateProfileSubmit}
    />
    <DeleteChatDialog
        isOpen={!!chatToDelete}
        onOpenChange={(open) => !open && setChatToDelete(null)}
        onConfirm={confirmDeleteChat}
    />
    <SidebarProvider>
        <div className="flex h-svh w-full items-center justify-center">
        <div className="flex h-svh w-full max-w-6xl bg-card/50 backdrop-blur-3xl border border-primary/20 rounded-lg">
                <ChatSidebar 
                    user={user}
                    isAdmin={isAdmin}
                    profilePic={profilePic}
                    isChatsLoading={isChatsLoading}
                    chats={chats}
                    activeChatId={activeChatId}
                    view={view}
                    onNewChat={handleNewChat}
                    setView={setView}
                    handleSelectChat={handleSelectChat}
                    handleDeleteChat={handleDeleteChat}
                    handleLogout={handleLogout}
                    onProfilePicChange={handleProfilePicUpload}
                    onUpdateProfileClick={() => setIsUpdateProfileOpen(true)}
                />

                <main className="flex-1 flex flex-col h-svh bg-transparent">
                    <MainHeader title={headerTitle} />
                    
                    {view === 'chat' ? (
                        <ChatView
                            messages={messages}
                            isMessagesLoading={isMessagesLoading}
                            isPending={isPending}
                            profilePic={profilePic}
                            onNewMessage={handleChatSubmit}
                        />
                    ) : (
                        <CodeEditorView />
                    )}
                </main>
            </div>
        </div>
    </SidebarProvider>
    </>
  );
}

    