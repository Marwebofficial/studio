'use client';

import { ShieldCheck, LayoutDashboard, LogOut, Users, UserPlus, LogIn as LogInIcon, Home } from 'lucide-react';
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
        return activityLogs?.slice(0, 5) || [];
    }, [activityLogs]);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            window.location.href = '/';
        }
    };
    
  return (
    <div className="admin-dashboard-theme flex flex-col min-h-screen bg-background">
      <div className="fixed inset-0 -z-10 h-full w-full bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-card/80 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Admin Dashboard
          </h1>
        </div>
        <div className='flex items-center gap-2'>
            <Button variant="outline" size="icon" asChild>
                <Link href="/">
                    <Home className="h-4 w-4" />
                </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 grid gap-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg shadow-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                    <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{stats.totalUsers}</div>}
                    <p className="text-xs text-muted-foreground pt-1">All registered users</p>
                </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg shadow-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
                    <ShieldCheck className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-3xl font-bold">{stats.totalAdmins}</div>}
                    <p className="text-xs text-muted-foreground pt-1">Users with admin privileges</p>
                </CardContent>
            </Card>
             <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg shadow-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Signups (24h)</CardTitle>
                    <UserPlus className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">...</div>
                    <p className="text-xs text-muted-foreground pt-1">New users in last 24 hours</p>
                </CardContent>
            </Card>
             <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg shadow-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Logins (24h)</CardTitle>
                    <LogInIcon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">...</div>
                    <p className="text-xs text-muted-foreground pt-1">Logins in last 24 hours</p>
                </CardContent>
            </Card>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg shadow-primary/5">
            <CardHeader>
                <CardTitle>User Signups (Last 7 Days)</CardTitle>
                <CardDescription>A visual summary of new user registrations over the past week.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                {isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signupData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--primary)/0.1)' }}
                            contentStyle={{
                                background: 'hsl(var(--card)/0.8)',
                                border: '1px solid hsl(var(--border)/0.5)',
                                borderRadius: 'var(--radius)',
                                backdropFilter: 'blur(4px)',
                            }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" name="New Users" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm border-border/50 shadow-lg shadow-primary/5">
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all registered users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-border/50">
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Signed Up</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? [...Array(5)].map((_, i) => (
                            <TableRow key={i} className="border-border/50">
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
                            <TableRow key={user.id} className="border-border/50">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="border-2 border-primary/20">
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
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg shadow-primary/5">
                <CardHeader>
                    <CardTitle>Recent Site Activity</CardTitle>
                    <CardDescription>Latest user signups and logins.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLoading ? [...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        )) : recentActivityLogs.map(log => (
                            <div key={log.id} className="flex items-start gap-4">
                                <Avatar className="h-9 w-9 border-2 border-primary/20">
                                    <AvatarFallback>{log.userEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{log.userEmail}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {log.activityType === 'signup' && <UserPlus className="h-3 w-3 text-green-500" />}
                                        {log.activityType === 'login' && <LogInIcon className="h-3 w-3 text-blue-500" />}
                                        <span className="capitalize">{log.activityType}</span>
                                        <span className='px-1'>·</span>
                                        <span>{log.timestamp ? format((log.timestamp as Timestamp).toDate(), 'p') : ''}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
                <ShieldCheck className="h-8 w-8 animate-spin text-primary" />
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
