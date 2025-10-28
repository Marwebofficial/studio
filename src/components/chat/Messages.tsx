
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { format } from 'date-fns';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Bot, User, FileText, Loader, Volume2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QuizView } from '@/components/quiz';
import { speak } from '@/app/actions';
import type { Message } from '@/lib/types';
import { CodeBlock } from './CodeBlock';


export const UserMessage = ({ content, fileDataUri, createdAt, profilePic }: { content: string, fileDataUri?: string, createdAt: any, profilePic: string | null }) => {
    const isImage = fileDataUri?.startsWith('data:image');
    
    const formatDate = (dateValue: any) => {
        if (!dateValue) return '';
        if (dateValue && typeof dateValue.toDate === 'function') {
            return format(dateValue.toDate(), 'HH:mm');
        }
        if (typeof dateValue === 'string') {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return format(date, 'HH:mm');
            }
        }
        return '';
    };

    return (
        <div className="flex items-start gap-3 justify-end group">
          <div className="max-w-2xl w-full space-y-2">
            <div className="bg-primary/10 border border-primary/20 text-foreground p-3 rounded-xl rounded-br-none backdrop-blur-sm shadow-lg shadow-primary/5">
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
              <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
            </div>
            <div className="text-xs text-muted-foreground text-right pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatDate(createdAt)}
            </div>
          </div>
          <Avatar className="h-8 w-8 border-2 border-primary/50 shadow-lg shadow-primary/10">
            <AvatarImage src={profilePic ?? undefined} alt="User profile picture" />
            <AvatarFallback className="bg-background">
              <User className="h-4 w-4 text-primary" />
            </AvatarFallback>
          </Avatar>
        </div>
      );
}
  

export const AssistantMessage = ({ message }: { message: Message }) => {
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const content = message.content;
    const isStringContent = typeof content === 'string';

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
      renderContent = (
        <ReactMarkdown
            remarkPlugins={[[remarkMath, {singleDollarTextMath: true}]]}
            rehypePlugins={[rehypeKatex]}
            components={{
                pre: ({node, ...props}) => <CodeBlock {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
      );
    } else {
      renderContent = message.content;
    }

      return (
        <div className="flex items-start gap-3 group">
          <Avatar className="h-8 w-8 border-2 border-secondary/50 shadow-lg shadow-secondary/10">
            <AvatarFallback className="bg-background">
              <Bot className="h-4 w-4 text-secondary" />
            </AvatarFallback>
          </Avatar>
          <div className="max-w-2xl w-full space-y-2">
              <div className="bg-secondary/10 p-3 rounded-xl rounded-bl-none border border-secondary/20 group relative backdrop-blur-sm shadow-lg shadow-secondary/5">
                  {message.imageUrl && <Image src={message.imageUrl} alt={typeof content === 'string' ? content : 'Generated image'} width={512} height={512} className="rounded-lg mb-2" />}
                  <div className="prose prose-sm prose-invert max-w-none text-foreground pb-6">
                      {renderContent}
                  </div>
                  <div className="absolute bottom-1 right-1 flex items-center">
                    {isStringContent && (content as string).length > 0 && !message.quiz && (
                      <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleSpeak} 
                          disabled={isGenerating}
                          className="h-7 w-7 text-secondary"
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
  
export const ErrorMessage = ({ content }: { content: string }) => (
    <div className="flex items-start gap-4">
      <Avatar className="h-8 w-8 border bg-destructive text-destructive-foreground">
        <AvatarFallback className="bg-destructive text-destructive-foreground">
            <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="prose prose-sm max-w-none text-destructive">
            <p className="font-semibold">Error</p>
            <p>{content}</p>
        </div>
      </div>
    </div>
);

export const LoadingMessage = () => (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 border-2 border-secondary/50 shadow-lg shadow-secondary/10">
        <AvatarFallback className="bg-background">
          <Bot className="h-4 w-4 text-secondary animate-pulse" />
        </AvatarFallback>
      </Avatar>
      <div className="max-w-2xl w-full space-y-4">
        <div className="bg-secondary/10 p-3 rounded-xl rounded-bl-none border border-secondary/20 backdrop-blur-sm shadow-lg shadow-secondary/5">
            <div className="space-y-2">
                <Skeleton className="h-4 w-5/6 bg-muted/50" />
                <Skeleton className="h-4 w-full bg-muted/50" />
                <Skeleton className="h-4 w-4/6 bg-muted/50" />
            </div>
        </div>
      </div>
    </div>
);

    