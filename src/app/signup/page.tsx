
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { FirebaseError } from 'firebase/app';

const formSchema = z.object({
  displayName: z.string().min(1, { message: 'Please enter your name.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
  adminCode: z.string().optional(),
});

const ADMIN_CODE = 'freechatadmin1234';

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      adminCode: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: values.displayName
      });
      
      const batch = writeBatch(firestore);

      // Create user profile document
      const userRef = doc(firestore, 'users', user.uid);
      const userData = { 
        email: user.email,
        displayName: values.displayName,
        createdAt: serverTimestamp(),
      };
      batch.set(userRef, userData);
      
      // Log activity
      const activityLogsRef = collection(firestore, 'activity_logs');
      const activityLogData = {
        userId: user.uid,
        userEmail: user.email,
        activityType: 'signup',
        timestamp: serverTimestamp(),
      };
      const activityLogRef = doc(activityLogsRef); // Create a doc with a random ID
      batch.set(activityLogRef, activityLogData);
      
      let isAdmin = false;
      if (values.adminCode) {
        if (values.adminCode === ADMIN_CODE) {
          const adminRef = doc(firestore, 'admins', user.uid);
          const adminData = { isAdmin: true };
          batch.set(adminRef, adminData);
          isAdmin = true;
        } else {
             toast({
                variant: 'destructive',
                title: 'Invalid Admin Code',
                description: "Your account was created, but the admin code was incorrect.",
            });
        }
      }

      await batch.commit().catch(serverError => {
        // Since this is a batch, we can't know which operation failed.
        // We will create a generic but still contextual error.
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid} or subcollections`,
            operation: 'write',
            requestResourceData: { userData, activityLogData },
        });
        errorEmitter.emit('permission-error', permissionError);
      });

       if (isAdmin) {
          toast({
            title: 'Admin Account Created',
            description: "You've been successfully signed up as an admin.",
          });
       } else if (!values.adminCode) {
         toast({
            title: 'Account Created',
            description: "You've been successfully signed up and logged in.",
        });
       }
        router.push('/');

    } catch (error) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage =
              'This email is already in use. Try logging in instead.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Your password is too weak. Please choose a stronger one.';
            break;
          default:
            errorMessage = 'An error occurred during sign up. Please try again later.';
            break;
        }
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: errorMessage,
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-svh items-center justify-center bg-background/95 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-accent/20 to-background bg-[length:200%_200%] animate-background-pan p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
                <Link href="/" className="inline-block p-2 rounded-full bg-accent/10 border border-accent/20">
                     <GraduationCap className="h-8 w-8 text-accent" />
                </Link>
            </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="m@example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adminCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Code (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter admin code if applicable"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
