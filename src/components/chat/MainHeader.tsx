
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';

interface MainHeaderProps {
    title: string;
}

export function MainHeader({ title }: MainHeaderProps) {
    return (
        <header className="flex items-center justify-between p-4 border-b border-primary/20 bg-transparent md:pl-0 sticky top-0 z-10">
            <SidebarTrigger className="md:hidden"/>
            <h1 className="text-lg font-heading tracking-tight truncate flex-1 text-center font-medium text-primary">
                {title}
            </h1>
            <div className="w-8 md:w-0" />
        </header>
    );
}

    