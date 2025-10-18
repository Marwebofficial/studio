
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, LayoutDashboard, LogOut } from 'lucide-react';
import Link from 'next/link';

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
import { useUser } from '@/firebase';

const ADMIN_CODE = 'freechatadminconsole';
const ADMIN_STORAGE_KEY = 'isAdmin';

const formSchema = z.object({
  adminCode: z.string().min(1, { message: 'Please enter an access code.' }),
});

const AdminDashboard = () => {

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    window.location.reload();
  };
    
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between gap-3 border-b bg-card/50 backdrop-blur-sm p-4 h-16">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="text-lg font-semibold tracking-tight">
            Admin Dashboard
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle>Site Activity</CardTitle>
                <CardDescription>
                    This is where site activity monitoring will be displayed.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-12">
                    <p>Activity monitoring components will be added here in a future update.</p>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
};


export default function AdminPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const adminStatus = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (adminStatus === 'true') {
      setIsAdmin(true);
    }
    setIsLoading(false);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adminCode: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.adminCode === ADMIN_CODE) {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      setIsAdmin(true);
      toast({
        title: 'Access Granted',
        description: 'Welcome to the admin dashboard.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'The admin code is incorrect.',
      });
    }
  }

  if (isLoading || isUserLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <ShieldCheck className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex h-svh items-center justify-center p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle>Authentication Required</CardTitle>
                    <CardDescription>
                        You must be logged in to access the admin area.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/login">Go to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="flex h-svh items-center justify-center bg-background/95 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-accent/20 to-background bg-[length:200%_200%] animate-background-pan p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
                <div className="inline-block p-2 rounded-full bg-accent/10 border border-accent/20">
                     <ShieldCheck className="h-8 w-8 text-accent" />
                </div>
            </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Enter the access code to view the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="adminCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Code</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Request Access
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            Not an admin?{' '}
            <Link href="/" className="underline">
              Go back home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    