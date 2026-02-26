'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
    const pathname = usePathname();

    const links = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Callers', href: '/callers', icon: Users },
    ];

    return (
        <div className="w-64 border-r border-[#27272a] bg-[#09090b] flex flex-col h-screen fixed left-0 top-0">
            <div className="h-16 flex items-center px-6 border-b border-[#27272a]">
                <div className="flex items-center gap-2 text-brand-500 font-bold text-xl tracking-tight">
                    <Zap className="w-6 h-6 fill-brand-500" />
                    <span>NexusCRM</span>
                </div>
            </div>

            <div className="flex-1 py-6 px-3 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "text-white bg-white/10"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r-full" />
                            )}
                            <Icon className={cn("w-5 h-5", isActive ? "text-brand-500" : "text-zinc-500 group-hover:text-zinc-300")} />
                            {link.name}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-[#27272a]">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        OP
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">Operator</span>
                        <span className="text-xs text-zinc-500">Admin</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
