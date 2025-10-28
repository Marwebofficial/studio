
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

const codeFormSchema = z.object({
    code: z.string().min(1, 'Please enter some code.'),
});

interface LogEntry {
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
}

export function CodeEditorView() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const { dialog, requestDialog, resolveDialog } = useDialogs();

    const codeForm = useForm<z.infer<typeof codeFormSchema>>({
        resolver: zodResolver(codeFormSchema),
        defaultValues: {
            code: `// Try using alert(), confirm(), or prompt()!
console.log('Hello from the editor!');

const name = prompt('What is your name?');
if (name) {
    const saidYes = confirm('Do you want to continue?');
    if (saidYes) {
        alert('Welcome, ' + name + '!');
    } else {
        console.warn('User cancelled.');
    }
}`,
        },
    });

    const handleCodeSubmit = async (data: z.infer<typeof codeFormSchema>) => {
        setLogs([]);

        const capturedLogs: LogEntry[] = [];
        const originalConsole = { ...console };
        
        // --- Override console ---
        console.log = (...args) => { capturedLogs.push({ type: 'log', message: args.map(arg => JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.log(...args); };
        console.error = (...args) => { capturedLogs.push({ type: 'error', message: args.map(arg => JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.error(...args); };
        console.warn = (...args) => { capturedLogs.push({ type: 'warn', message: args.map(arg => JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.warn(...args); };
        console.info = (...args) => { capturedLogs_push({ type: 'info', message: args.map(arg => JSON.stringify(arg, null, 2)).join(' ') }); originalConsole.info(...args); };

        // --- Override window functions ---
        const originalAlert = window.alert;
        const originalConfirm = window.confirm;
        const originalPrompt = window.prompt;
        
        window.alert = (message: string) => {
            requestDialog({ type: 'alert', message });
        };
        window.confirm = (message: string) => {
            requestDialog({ type: 'confirm', message });
            // This will be resolved by the dialog itself
            return false; // Placeholder
        };
        window.prompt = (message: string, defaultValue?: string) => {
            requestDialog({ type: 'prompt', message, defaultValue });
             // This will be resolved by the dialog itself
            return null; // Placeholder
        };

        try {
            // Use Function constructor for safer execution
            const execute = new Function('__requestDialog', data.code);
            await execute(requestDialog);
        } catch (error: any) {
            capturedLogs.push({ type: 'error', message: error.message });
        } finally {
            // --- Restore original functions ---
            window.alert = originalAlert;
            window.confirm = originalConfirm;
            window.prompt = originalPrompt;
            Object.assign(console, originalConsole);

            setLogs(capturedLogs);
        }
    };
    
    return (
        <div className="flex-1 flex flex-col p-4 gap-4">
            <JSDialogs dialog={dialog} onResolve={resolveDialog} />
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
                                        placeholder="Enter your JavaScript code here..."
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
        </div>
    );
}
