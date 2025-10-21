'use client';

import { ShieldCheck, LayoutDashboard, LogOut, Users, UserPlus, LogIn as LogInIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { format, subDays, startOfDay } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from 'recharts';

const AdminDashboard = () => {
    const firestore = useFirestore();
    const auth = useAuth();
    
    const usersRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection(usersRef);

    const adminsRef = useMemoFirebase(() => collection(firestore, 'admins'), [firestore]);
    const { data: admins, isLoading: isLoadingAdmins } = useCollection(adminsRef);

    const logsQuery = useMemoFirebase(() => {
        const logsRef = collection(firestore, 'activity_logs');
        return query(logsRef, orderBy('timestamp', 'desc'));
    }, [firestore]);
    const { data: activityLogs, isLoading: isLoadingLogs } = useCollection(logsQuery);
    
    const isLoading = isLoadingUsers || isLoadingAdmins || isLoadingLogs;

    const stats = useMemo(() => ({
        totalUsers: users?.length || 0,
        totalAdmins: admins?.length || 0,
    }), [users, admins]);

    const signupData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), i);
            return { date: format(d, 'MMM d'), count: 0 };
        }).reverse();

        if (!users) return last7Days;

        const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

        users.forEach(user => {
            if (user.createdAt) {
                const signupDate = (user.createdAt as Timestamp).toDate();
                if (signupDate >= sevenDaysAgo) {
                    const formattedDate = format(signupDate, 'MMM d');
                    const day = last7Days.find(d => d.date === formattedDate);
                    if (day) {
                        day.count++;
                    }
                }
            }
        });
        return last7Days;
    }, [users]);
    
    const recentActivityLogs = useMemo(() => {
        return activityLogs?.slice(0, 10) || [];
    }, [activityLogs]);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            window.location.href = '/';
        }
    };
    
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="flex items-center justify-between gap-3 border-b bg-card p-4 h-16 sticky top-0 z-10">
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
      <main className="flex-1 p-4 md:p-8 grid gap-8">
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.totalUsers}</div>}
                    <p className="text-xs text-muted-foreground">All registered users</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Admins</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{stats.totalAdmins}</div>}
                    <p className="text-xs text-muted-foreground">Users with admin privileges</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>User Signups (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
                {isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signupData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                background: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                            }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" name="New Users" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Signed Up</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            </TableRow>
                        )) : (users || []).map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium">{user.displayName || 'N/A'}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {user.createdAt ? format((user.createdAt as Timestamp).toDate(), 'PP') : 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Site Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Activity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                </TableRow>
                            )) : recentActivityLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{log.userEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-medium">{log.userEmail}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {log.activityType === 'signup' && <UserPlus className="h-4 w-4 text-green-500" />}
                                            {log.activityType === 'login' && <LogInIcon className="h-4 w-4 text-blue-500" />}
                                            <span className="capitalize">{log.activityType}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
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
  
    if (user && isAdmin) {
        return <AdminDashboard />;
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
        );
    }
  
    // This case covers user && !isAdmin
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
    );
}
