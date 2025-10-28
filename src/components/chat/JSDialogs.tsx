
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

type DialogState = {
    type: 'alert' | 'confirm' | 'prompt';
    message: string;
    defaultValue?: string;
} | null;

// Custom hook to manage dialog state and promise resolution
export const useDialogs = () => {
    const [dialog, setDialog] = useState<DialogState>(null);
    const resolver = useRef<((value: any) => void) | null>(null);

    const requestDialog = (state: Omit<NonNullable<DialogState>, 'resolve'>) => {
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

    useEffect(() => {
        if (dialog?.type === 'prompt') {
            setPromptValue(dialog.defaultValue || '');
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
                    <AlertDialogTitle className="font-heading capitalize">{dialog.type}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dialog.message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {dialog.type === 'prompt' && (
                    <div className="py-2">
                        <Input 
                            value={promptValue}
                            onChange={(e) => setPromptValue(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
                <AlertDialogFooter>
                    {dialog.type !== 'alert' && <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>}
                    <AlertDialogAction onClick={handleConfirm}>OK</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
