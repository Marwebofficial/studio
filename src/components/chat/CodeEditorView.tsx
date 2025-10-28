
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Play } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JSDialogs, useDialogs } from './JSDialogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const jsFormSchema = z.object({
    code: z.string().min(1, 'Please enter some code.'),
});

const htmlFormSchema = z.object({
    code: z.string().min(1, 'Please enter some code.'),
});

interface LogEntry {
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
}

export function CodeEditorView() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [htmlOutput, setHtmlOutput] = useState('');
    const { dialog, requestDialog, resolveDialog } = useDialogs();

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
        <p>This is a sample HTML page.</p>
    </div>
</body>
</html>
`,
        },
    });

    useEffect(() => {
        // Set initial HTML output on component mount
        setHtmlOutput(htmlForm.getValues('code'));
    }, [htmlForm]);


    const handleJsSubmit = async (data: z.infer<typeof jsFormSchema>) => {
        setLogs([]);

        const capturedLogs: LogEntry[] = [];
        const originalConsole = { ...console };
        
        console.log = (...args) => { capturedLogs.push({ type: 'log', message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.log(...args); };
        console.error = (...args) => { capturedLogs.push({ type: 'error', message: args.map(arg => arg instanceof Error ? arg.message : JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.error(...args); };
        console.warn = (...args) => { capturedLogs.push({ type: 'warn', message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.warn(...args); };
        console.info = (...args) => { capturedLogs.push({ type: 'info', message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.info(...args); };

        const alert = async (message: string) => {
            await requestDialog({ type: 'alert', message });
        };
        const confirm = async (message: string) => {
            return await requestDialog({ type: 'confirm', message });
        };
        const prompt = async (message: string, defaultValue?: string) => {
            return await requestDialog({ type: 'prompt', message, defaultValue });
        };

        try {
            const executeCode = new Function('alert', 'confirm', 'prompt', `return (async () => { ${data.code} })();`);
            await executeCode(alert, confirm, prompt);
        } catch (error: any) {
            console.error(error);
        } finally {
            Object.assign(console, originalConsole);
            setLogs(capturedLogs);
        }
    };
    
    const handleHtmlSubmit = (data: z.infer<typeof htmlFormSchema>) => {
        setHtmlOutput(data.code);
    };

    return (
        <div className="flex-1 flex flex-col p-4 gap-4">
            <JSDialogs dialog={dialog} onResolve={resolveDialog} />
            <Tabs defaultValue="js" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="js">JavaScript</TabsTrigger>
                    <TabsTrigger value="html">HTML/CSS</TabsTrigger>
                </TabsList>
                <TabsContent value="js" className="flex-1 flex flex-col gap-4 mt-2">
                    <Form {...jsForm}>
                        <form onSubmit={jsForm.handleSubmit(handleJsSubmit)} className="flex-1 flex flex-col gap-4">
                            <FormField
                                control={jsForm.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem className="flex-1 flex flex-col">
                                        <FormLabel>JavaScript Editor</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter your JavaScript code here. Use await for prompt() and confirm()."
                                                className="flex-1 font-mono bg-input border-input focus-visible:ring-primary/50 resize-none"
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
                    <div className="h-[40%] flex flex-col border border-primary/20 rounded-lg bg-background/50">
                        <div className="p-3 border-b border-primary/20">
                            <h3 className="font-semibold font-heading">Console</h3>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 font-mono text-sm">
                                {logs.length === 0 && <p className="text-muted-foreground">Console output will appear here.</p>}
                                {logs.map((log, index) => (
                                    <div key={index} className={`whitespace-pre-wrap ${
                                        log.type === 'error' ? 'text-destructive' : 
                                        log.type === 'warn' ? 'text-yellow-500' : ''
                                    }`}>
                                        {log.message}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </TabsContent>
                <TabsContent value="html" className="flex-1 flex flex-col gap-4 mt-2">
                    <Form {...htmlForm}>
                        <form onSubmit={htmlForm.handleSubmit(handleHtmlSubmit)} className="flex-1 flex flex-col gap-4">
                            <FormField
                                control={htmlForm.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem className="flex-1 flex flex-col">
                                        <FormLabel>HTML/CSS Editor</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter your HTML and CSS code here."
                                                className="flex-1 font-mono bg-input border-input focus-visible:ring-primary/50 resize-none"
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
                     <div className="h-[40%] flex flex-col border border-primary/20 rounded-lg bg-background/50">
                        <div className="p-3 border-b border-primary/20">
                            <h3 className="font-semibold font-heading">Output</h3>
                        </div>
                        <div className="flex-1 relative">
                           <iframe
                                srcDoc={htmlOutput}
                                title="HTML Output"
                                sandbox="allow-scripts"
                                className="w-full h-full bg-white"
                           />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    