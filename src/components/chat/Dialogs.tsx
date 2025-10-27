
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface UpdateProfileDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<{ displayName: string }>;
    onSubmit: (values: { displayName: string }) => void;
}

export function UpdateProfileDialog({ isOpen, onOpenChange, form, onSubmit }: UpdateProfileDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-background/80 backdrop-blur-lg border-primary/20">
                <DialogHeader>
                    <DialogTitle className="font-heading">Update Your Profile</DialogTitle>
                    <DialogDescription>
                        Welcome to the future of learning. Let's start with your name.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting} variant="outline" className="bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary">
                                {form.formState.isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

interface DeleteChatDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function DeleteChatDialog({ isOpen, onOpenChange, onConfirm }: DeleteChatDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-background/80 backdrop-blur-lg border-destructive/30">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this conversation. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

    