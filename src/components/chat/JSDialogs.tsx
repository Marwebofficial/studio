
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { AlertDialogCancel } from '@radix-ui/react-alert-dialog';

type DialogState = {
    type: 'alert' | 'confirm' | 'prompt';
    message: string;
    defaultValue?: string;
} | null;

// Custom hook to manage dialog state and promise resolution
export const useDialogs = () => {
    const [dialog, setDialog] = useState<DialogState>(null);
    const resolver = useRef<((value: any) => void) | null>(null);

    const requestDialog = (state: Omit<NonNullable<DialogState>, 'resolve'>): Promise<any> => {
        return new Promise((resolve) => {
            setDialog(state);
            resolver.current = resolve;
        });
    };

    const resolveDialog = (value: any) => {
        if (resolver.current) {
            resolver.current(value);
        }
        setDialog(null);
        resolver.current = null;
    };

    return { dialog, requestDialog, resolveDialog };
};

interface JSDialogsProps {
    dialog: DialogState;
    onResolve: (value: any) => void;
}

export function JSDialogs({ dialog, onResolve }: JSDialogsProps) {
    const [promptValue, setPromptValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (dialog?.type === 'prompt') {
            setPromptValue(dialog.defaultValue || '');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [dialog]);

    if (!dialog) return null;

    const isOpen = dialog !== null;

    const handleCancel = () => {
        if (dialog.type === 'confirm') {
            onResolve(false);
        } else if (dialog.type === 'prompt') {
            onResolve(null);
        } else {
            onResolve(undefined);
        }
    };
    
    const handleConfirm = () => {
        if (dialog.type === 'confirm') {
            onResolve(true);
        } else if (dialog.type === 'prompt') {
            onResolve(promptValue);
        } else { // alert
            onResolve(undefined);
        }
    };
    
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
            <AlertDialogContent className="bg-background/80 backdrop-blur-lg border-primary/20">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading capitalize">JavaScript {dialog.type}</AlertDialogTitle>
                    <AlertDialogDescription className="py-2 break-words">
                        {dialog.message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {dialog.type === 'prompt' && (
                    <div className="py-2">
                        <Input 
                            ref={inputRef}
                            value={promptValue}
                            onChange={(e) => setPromptValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleConfirm();
                                }
                            }}
                        />
                    </div>
                )}
                <AlertDialogFooter>
                    {dialog.type !== 'alert' && <AlertDialogCancel asChild><Button variant="outline" onClick={handleCancel}>Cancel</Button></AlertDialogCancel>}
                    <Button onClick={handleConfirm}>OK</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

    