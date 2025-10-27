
'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { MessageSquarePlus, Code, User, Edit, Shield, LogOut, Trash } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Chat } from '@/lib/types';

interface ChatSidebarProps {
    user: FirebaseUser | null;
    isAdmin: boolean;
    profilePic: string | null;
    isChatsLoading: boolean;
    chats: Chat[] | null;
    activeChatId: string | null;
    view: 'chat' | 'code';
    setView: (view: 'chat' | 'code') => void;
    handleSelectChat: (chatId: string) => void;
    handleDeleteChat: (chatId: string) => void;
    handleLogout: () => void;
    onProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpdateProfileClick: () => void;
}

export function ChatSidebar({
    user,
    isAdmin,
    profilePic,
    isChatsLoading,
    chats,
    activeChatId,
    view,
    setView,
    handleSelectChat,
    handleDeleteChat,
    handleLogout,
    onProfilePicChange,
    onUpdateProfileClick,
}: ChatSidebarProps) {
    const profilePicInputRef = useRef<HTMLInputElement>(null);

    return (
        <Sidebar className="border-r border-primary/20 bg-transparent">
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                            <svg viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" className="h-5 w-5"><path d="M3 12h2.5l1.5-3 3 6 3-6 1.5 3H19"/></svg>
                        </div>
                        <h2 className="text-lg font-heading tracking-tight font-medium">FreeChat</h2>
                    </Link>
                </div>
            </SidebarHeader>
            <SidebarContent className="p-2 flex flex-col">
                <Button variant={view === 'chat' ? 'secondary' : 'ghost'} className="w-full border border-primary/20 justify-start hover:bg-primary/10 hover:text-primary" onClick={() => setView('chat')}>
                    <MessageSquarePlus className="mr-2" /> Chat
                </Button>
                <Button variant={view === 'code' ? 'secondary' : 'ghost'} className="w-full border border-primary/20 justify-start hover:bg-primary/10 hover:text-primary mt-2" onClick={() => setView('code')}>
                    <Code className="mr-2" /> Code Editor
                </Button>
                <ScrollArea className="flex-1 my-4">
                <div className="px-2 space-y-1">
                    <h3 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider font-sans">CHAT HISTORY</h3>
                    {isChatsLoading ? (
                    <div className="space-y-2 pt-2">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full bg-muted/80" />)}
                    </div>
                    ) : (
                    chats?.map((chat) => (
                        <div key={chat.id} className="group relative">
                        <Button
                            variant="ghost"
                            className={cn("w-full justify-start truncate pr-8", activeChatId === chat.id && view === 'chat' && "bg-primary/10 text-primary")}
                            onClick={() => handleSelectChat(chat.id)}
                        >
                            {chat.title}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
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
                <div className="p-2 space-y-2 border-t border-primary/20">
                    {user && (
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <Avatar className="h-9 w-9 cursor-pointer" onClick={() => profilePicInputRef.current?.click()}>
                            <AvatarImage src={profilePic ?? undefined} alt="Profile picture" />
                                <AvatarFallback>
                                    {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : <User />}
                                </AvatarFallback>
                            </Avatar>
                            <input type="file" accept="image/*" ref={profilePicInputRef} onChange={onProfilePicChange} className="hidden" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold truncate">{user.displayName || 'Anonymous User'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onUpdateProfileClick}><Edit /></Button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        {isAdmin && <Button variant="outline" className="flex-1 border-secondary/50 text-secondary hover:bg-secondary/10" asChild><Link href="/admin"><Shield /> Admin</Link></Button>}
                        <Button variant="destructive" className="flex-1" onClick={handleLogout}><LogOut /> Logout</Button>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

    