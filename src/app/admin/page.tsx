
'use client';

import { ShieldCheck, LayoutDashboard, LogOut, UserPlus, LogIn as LogInIcon, Clock } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { collection, query, orderBy, limit, type DocumentData, type CollectionReference, type Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';


import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard = () => {
    const auth = useAuth();
    const firestore = useFirestore();

    const activityLogsRef = useMemoFirebase(() => {
        return collection(firestore, 'activity_logs') as CollectionReference<DocumentData>;
    }, [firestore]);

    const activityLogsQuery = useMemoFirebase(() => {
        if (!activityLogsRef) return null;
        return query(activityLogsRef, orderBy('timestamp', 'desc'), limit(20));
    }, [activityLogsRef]);

    const { data: activityLogs, isLoading: isLoadingLogs } = useCollection(activityLogsQuery);

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
                    A real-time log of recent user activity on the site.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingLogs && [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-4 w-20 ml-auto" />
                                </TableCell>
                            </TableRow>
                        ))}
                        {activityLogs && activityLogs.length > 0 ? activityLogs.map(log => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>
                                                {log.userEmail.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{log.userEmail}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {log.activityType === 'signup' && <UserPlus className="h-4 w-4 text-green-500" />}
                                        {log.activityType === 'login' && <LogInIcon className="h-4 w-4 text-blue-500" />}
                                        <span className="capitalize">{log.activityType}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    <div className="flex items-center justify-end gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>{log.timestamp ? formatDistanceToNow((log.timestamp as Timestamp).toDate(), { addSuffix: true }) : 'N/A'}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            !isLoadingLogs && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No recent activity.
                                    </TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
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
