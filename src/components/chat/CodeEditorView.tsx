
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { RunCodeOutput } from '@/lib/types';

const codeFormSchema = z.object({
    code: z.string().min(1, 'Please enter some code.'),
});

interface CodeEditorViewProps {
    onCodeSubmit: (code: string) => Promise<RunCodeOutput | null>;
}

export function CodeEditorView({ onCodeSubmit }: CodeEditorViewProps) {
    const [codeResult, setCodeResult] = useState<RunCodeOutput | null>(null);
    const [isExecutingCode, setIsExecutingCode] = useState(false);

    const codeForm = useForm<z.infer<typeof codeFormSchema>>({
        resolver: zodResolver(codeFormSchema),
        defaultValues: {
          code: "console.log('Hello, World!');",
        },
    });

    const handleCodeSubmit = async (data: z.infer<typeof codeFormSchema>) => {
        setIsExecutingCode(true);
        setCodeResult(null);
        const result = await onCodeSubmit(data.code);
        setCodeResult(result);
        setIsExecutingCode(false);
    };

    return (
        <div className="flex-1 flex flex-col p-4 gap-4">
            <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="flex-1 flex flex-col gap-4">
                    <FormField
                        control={codeForm.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem className="flex-1 flex flex-col">
                                <FormLabel>Code Editor</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter your code here..."
                                        className="flex-1 font-mono bg-input border-input focus-visible:ring-primary/50 resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isExecutingCode} className="w-full md:w-auto md:self-end">
                        {isExecutingCode ? <><Loader className="mr-2 animate-spin" />Running...</> : <><Play className="mr-2" />Run Code</>}
                    </Button>
                </form>
            </Form>
            <div className="h-[40%] flex flex-col border border-primary/20 rounded-lg bg-background/50">
                <div className="p-3 border-b border-primary/20">
                    <h3 className="font-semibold font-heading">Console</h3>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {isExecutingCode && (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        )}
                        {codeResult ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-primary">Output:</h4>
                                    <pre className="mt-1 bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-wrap">{codeResult.output || 'No output.'}</pre>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-primary">Explanation:</h4>
                                    <div className="prose prose-sm prose-invert max-w-none text-foreground mt-1">
                                        <ReactMarkdown>{codeResult.explanation}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            !isExecutingCode && <p className="text-sm text-muted-foreground">Output and explanation will appear here after running the code.</p>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

    