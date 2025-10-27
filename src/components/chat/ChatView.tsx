
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Paperclip, Send, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form } from '@/components/ui/form';
import { UserMessage, AssistantMessage, ErrorMessage, LoadingMessage } from './Messages';
import { WelcomeScreen } from './WelcomeScreen';
import type { Message } from '@/lib/types';

const formSchema = z.object({
  question: z.string().trim().min(1, 'Please enter a question.'),
});

interface ChatViewProps {
    messages: Message[];
    isMessagesLoading: boolean;
    isPending: boolean;
    profilePic: string | null;
    onNewMessage: (question: string, fileDataUri?: string) => void;
}

export function ChatView({ messages, isMessagesLoading, isPending, profilePic, onNewMessage }: ChatViewProps) {
    const [fileDataUri, setFileDataUri] = useState<string | undefined>();
    const [fileName, setFileName] = useState<string | undefined>();
    const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { question: '' },
    });

    useEffect(() => {
        if (scrollAreaViewportRef.current) {
          scrollAreaViewportRef.current.scrollTo({
            top: scrollAreaViewportRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
    }, [messages, isPending]);

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

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        onNewMessage(data.question, fileDataUri);
        form.reset();
        setFileDataUri(undefined);
        setFileName(undefined);
    };

    return (
        <>
            <div className="flex-1 relative">
                <ScrollArea className="h-full" viewportRef={scrollAreaViewportRef}>
                    <div className="p-4 md:p-6 space-y-8">
                        {isMessagesLoading ? (
                            <LoadingMessage />
                        ) : (
                            messages?.map((message) => {
                                if (message.role === 'user') {
                                    return <UserMessage key={message.id} content={message.content as string} fileDataUri={message.fileDataUri} createdAt={message.createdAt} profilePic={profilePic} />;
                                }
                                if (message.role === 'assistant') {
                                    return <AssistantMessage key={message.id} message={message} />;
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
                    <WelcomeScreen onPromptClick={(prompt) => form.setValue('question', prompt)} />
                )}
            </div>
            <footer className="p-4 border-t border-primary/20 bg-transparent">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="relative max-w-4xl mx-auto">
                        {fileDataUri && (
                            <div className="absolute bottom-full left-0 mb-2 w-full">
                                <div className="p-2 bg-muted rounded-md flex items-center justify-between gap-2 border border-input">
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
                            className="pr-28 bg-input border-input focus-visible:ring-primary/50"
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
                                className="text-muted-foreground hover:text-primary"
                            >
                                <Paperclip />
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <Button type="submit" size="icon" disabled={isPending || !form.formState.isValid} className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/50">
                                <Send />
                            </Button>
                        </div>
                    </form>
                </Form>
            </footer>
        </>
    );
}

    