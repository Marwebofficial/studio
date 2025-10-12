'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, User, Send, Link as LinkIcon, ExternalLink } from 'lucide-react';
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

type Message = {
  id: string;
  role: 'user' | 'assistant';
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
                    className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-secondary/80"
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

const LoadingMessage = () => (
  <div className="flex items-start gap-4">
    <Avatar className="h-8 w-8 border bg-primary text-primary-foreground">
      <AvatarFallback className="bg-primary text-primary-foreground">
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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: data.question },
    ]);
    form.reset();

    startTransition(async () => {
      const result = await getAnswer(data.question);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        setMessages((prev) =>
          prev.slice(0, -1)
        );
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
    <div className="flex h-svh flex-col">
      <header className="flex items-center gap-3 border-b p-4">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold tracking-tight">
          Web Chat Navigator
        </h1>
      </header>

      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollAreaViewportRef}>
          <div className="mx-auto max-w-3xl p-4 md:p-8">
            {messages.length === 0 ? (
                <div className="flex h-[70vh] items-center justify-center">
                    <Card className="w-full max-w-md text-center">
                        <CardHeader>
                            <CardTitle>Welcome!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Ask any question and get answers from the web.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
              <div className="space-y-8">
                {messages.map((message) => (
                  message.role === 'user' ? (
                    <UserMessage key={message.id} content={message.content} />
                  ) : (
                    <AssistantMessage
                      key={message.id}
                      content={message.content}
                      sources={message.sources}
                    />
                  )
                ))}
                {isPending && <LoadingMessage />}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      <footer className="border-t p-4">
        <div className="mx-auto max-w-3xl">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-start gap-4"
            >
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Ask me anything..."
                        autoComplete="off"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" disabled={isPending}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </Form>
        </div>
      </footer>
    </div>
  );
}
