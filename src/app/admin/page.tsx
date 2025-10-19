
'use client';

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

import { useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

const AdminDashboard = () => {
    const auth = useAuth();

    const handleLogout = async () => {
        await signOut(auth);
        window.location.href = '/';
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
  const { user, isAdmin, isUserLoading } = useUser();

  if (isUserLoading) {
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

  if (!isAdmin) {
    return (
        <div className="flex h-svh items-center justify-center p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>
                        You do not have permission to view this page.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/">Go to Homepage</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return <AdminDashboard />;
}
