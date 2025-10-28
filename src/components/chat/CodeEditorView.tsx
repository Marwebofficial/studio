
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Play, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JSDialogs, useDialogs } from './JSDialogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runCode } from '@/app/actions';
import { Skeleton } from '../ui/skeleton';
import type { RunCodeOutput } from '@/lib/types';


const jsFormSchema = z.object({
    code: z.string().min(1, 'Please enter some code.'),
});

const htmlFormSchema = z.object({
    code: z.string().min(1, 'Please enter some code.'),
});

const pythonFormSchema = z.object({
    code: z.string().min(1, 'Please enter some code.'),
});

interface LogEntry {
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
}

export function CodeEditorView() {
    const [activeTab, setActiveTab] = useState('js');
    const [outputType, setOutputType] = useState<'js' | 'html' | 'ai'>('js');
    
    // JS states
    const [jsLogs, setJsLogs] = useState<LogEntry[]>([]);
    const { dialog, requestDialog, resolveDialog } = useDialogs();

    // HTML states
    const [htmlOutput, setHtmlOutput] = useState('');

    // Python / AI states
    const [isAiPending, setIsAiPending] = useState(false);
    const [aiOutput, setAiOutput] = useState<RunCodeOutput | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    const jsForm = useForm<z.infer<typeof jsFormSchema>>({
        resolver: zodResolver(jsFormSchema),
        defaultValues: {
            code: `// Try using alert(), confirm(), or prompt()!
console.log('Hello from the editor!');

async function run() {
    const name = await prompt('What is your name?');
    if (name) {
        const saidYes = await confirm('Do you want to continue, ' + name + '?');
        if (saidYes) {
            alert('Welcome, ' + name + '!');
        } else {
            console.warn('User cancelled.');
        }
    }
}

run();
`,
        },
    });

    const htmlForm = useForm<z.infer<typeof htmlFormSchema>>({
        resolver: zodResolver(htmlFormSchema),
        defaultValues: {
            code: `<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <style>
        body {
            font-family: sans-serif;
            background-color: #f0f0f0;
            color: #333;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 90%;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #007BFF;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <p>This is a sample HTML page rendered in an iframe.</p>
        <button onclick="alert('It works!')">Click me</button>
    </div>
</body>
</html>
`,
        },
    });
    
    const pythonForm = useForm<z.infer<typeof pythonFormSchema>>({
        resolver: zodResolver(pythonFormSchema),
        defaultValues: {
            code: `# Welcome to the Python interpreter!
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        print(a, end=' ')
        a, b = b, a + b
    print()

print("Fibonacci sequence up to 10 terms:")
fibonacci(10)
`,
        },
    });

    useEffect(() => {
        setHtmlOutput(htmlForm.getValues('code'));
    }, [htmlForm]);

    const handleJsSubmit = async (data: z.infer<typeof jsFormSchema>) => {
        setJsLogs([]);
        setOutputType('js');
        setActiveTab('output');

        const capturedLogs: LogEntry[] = [];
        const originalConsole = { ...console };
        
        console.log = (...args) => { capturedLogs.push({ type: 'log', message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.log(...args); };
        console.error = (...args) => { capturedLogs.push({ type: 'error', message: args.map(arg => arg instanceof Error ? arg.message : JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.error(...args); };
        console.warn = (...args) => { capturedLogs.push({ type: 'warn', message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.warn(...args); };
        console.info = (...args) => { capturedLogs.push({ type: 'info', message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.info(...args); };

        const alert = (message: string) => requestDialog({ type: 'alert', message });
        const confirm = (message: string) => requestDialog({ type: 'confirm', message });
        const prompt = (message: string, defaultValue?: string) => requestDialog({ type: 'prompt', message, defaultValue });

        try {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const executeCode = new AsyncFunction('alert', 'confirm', 'prompt', data.code);
            await executeCode(alert, confirm, prompt);
        } catch (error: any) {
            console.error(error);
        } finally {
            Object.assign(console, originalConsole);
            setJsLogs(capturedLogs);
        }
    };
    
    const handleHtmlSubmit = (data: z.infer<typeof htmlFormSchema>) => {
        setHtmlOutput(data.code);
        setOutputType('html');
        setActiveTab('output');
    };

    const handlePythonSubmit = async (data: z.infer<typeof pythonFormSchema>) => {
        setOutputType('ai');
        setActiveTab('output');
        setIsAiPending(true);
        setAiOutput(null);
        setAiError(null);
        
        const { result, error } = await runCode({ code: data.code, language: 'python' });
        
        if (error) {
            setAiError(error);
        } else if (result) {
            setAiOutput(result);
        }
        setIsAiPending(false);
    };

    const renderOutput = () => {
        switch (outputType) {
            case 'js':
                return (
                    <ScrollArea className="flex-1">
                        <div className="p-4 font-mono text-sm">
                            {jsLogs.length === 0 && <p className="text-muted-foreground">Console output will appear here.</p>}
                            {jsLogs.map((log, index) => (
                                <div key={index} className={`whitespace-pre-wrap ${
                                    log.type === 'error' ? 'text-destructive' : 
                                    log.type === 'warn' ? 'text-yellow-500' : ''
                                }`}>
                                    {log.message}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                );
            case 'html':
                return (
                    <iframe
                        srcDoc={htmlOutput}
                        title="HTML Output"
                        sandbox="allow-scripts allow-modals"
                        className="w-full h-full bg-white"
                    />
                );
            case 'ai':
                return (
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {isAiPending && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold font-heading">Simulated Output</h3>
                                    <Skeleton className="h-20 w-full bg-muted/50" />
                                    <h3 className="font-semibold font-heading">Explanation</h3>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-5/6 bg-muted/50" />
                                        <Skeleton className="h-4 w-full bg-muted/50" />
                                        <Skeleton className="h-4 w-4/6 bg-muted/50" />
                                    </div>
                                </div>
                            )}
                            {aiError && <p className="text-destructive">Error: {aiError}</p>}
                            {aiOutput && (
                                <>
                                    <div>
                                        <h3 className="font-semibold font-heading mb-2">Simulated Output</h3>
                                        <pre className="bg-background/80 p-3 rounded-md border border-input text-sm">
                                            <code>{aiOutput.output}</code>
                                        </pre>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold font-heading mb-2">Explanation</h3>
                                        <div className="prose prose-sm prose-invert max-w-none text-foreground">
                                            <ReactMarkdown remarkPlugins={[[remarkMath, {singleDollarTextMath: true}]]} rehypePlugins={[rehypeKatex]}>{aiOutput.explanation}</ReactMarkdown>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                );
            default:
                return null;
        }
    }

    return (
        <div className="flex-1 flex flex-col p-4 gap-4 h-full">
            <JSDialogs dialog={dialog} onResolve={resolveDialog} />
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="js">JavaScript</TabsTrigger>
                    <TabsTrigger value="html">HTML/CSS</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="output">Output</TabsTrigger>
                </TabsList>

                <TabsContent value="js" className="flex-1 flex flex-col gap-4 mt-2 h-full overflow-hidden">
                    <Form {...jsForm}>
                        <form onSubmit={jsForm.handleSubmit(handleJsSubmit)} className="flex-1 flex flex-col gap-4 h-full">
                            <FormField
                                control={jsForm.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem className="flex-1 flex flex-col">
                                        <FormLabel className="sr-only">JavaScript Editor</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter your JavaScript code here. Use await for prompt() and confirm()."
                                                className="h-full font-mono bg-input border-input focus-visible:ring-primary/50 resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full md:w-auto md:self-end">
                                <Play className="mr-2" />Run Code
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
                
                <TabsContent value="html" className="flex-1 flex flex-col gap-4 mt-2 h-full overflow-hidden">
                    <Form {...htmlForm}>
                        <form onSubmit={htmlForm.handleSubmit(handleHtmlSubmit)} className="flex-1 flex flex-col gap-4 h-full">
                            <FormField
                                control={htmlForm.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem className="flex-1 flex flex-col">
                                        <FormLabel className="sr-only">HTML/CSS Editor</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter your HTML and CSS code here."
                                                className="h-full font-mono bg-input border-input focus-visible:ring-primary/50 resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full md:w-auto md:self-end">
                                <Play className="mr-2" />Run Code
                            </Button>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="python" className="flex-1 flex flex-col gap-4 mt-2 h-full overflow-hidden">
                    <Form {...pythonForm}>
                        <form onSubmit={pythonForm.handleSubmit(handlePythonSubmit)} className="flex-1 flex flex-col gap-4 h-full">
                            <FormField
                                control={pythonForm.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem className="flex-1 flex flex-col">
                                        <FormLabel className="sr-only">Python Editor</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter your Python code here."
                                                className="h-full font-mono bg-input border-input focus-visible:ring-primary/50 resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full md:w-auto md:self-end" disabled={isAiPending}>
                                {isAiPending ? <Bot className="mr-2 animate-spin" /> : <Play className="mr-2" />}
                                Analyze Code
                            </Button>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="output" className="flex-1 flex flex-col mt-2 h-full overflow-hidden">
                     <div className="flex-1 flex flex-col border border-primary/20 rounded-lg bg-background/50 h-full">
                        <div className="p-3 border-b border-primary/20">
                            <h3 className="font-semibold font-heading">
                                {outputType === 'js' && 'Console'}
                                {outputType === 'html' && 'Rendered HTML'}
                                {outputType === 'ai' && 'AI Analysis'}
                            </h3>
                        </div>
                        {renderOutput()}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
