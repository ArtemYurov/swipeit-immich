import React from 'react';
import { useSwipe } from '@/context/SwipeContext';
import { useAuth } from '@/context/AuthContext';
import { Image as ImageIcon, Calendar, Users, LogOut, HardDrive, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatBytes } from '@/lib/utils';

export const Sidebar = () => {
    const { viewMode, setViewMode, stats } = useSwipe();
    const { logout, user } = useAuth();

    const menuItems = [
        { id: 'albums', label: 'Albums', icon: ImageIcon },
        { id: 'timeline', label: 'Timeline', icon: Calendar },
        { id: 'people', label: 'People', icon: Users },
    ];

    return (
        <div className="w-64 h-full bg-zinc-900 border-r border-white/5 flex flex-col hidden md:flex">
            {/* Logo area */}
            <div className="p-6">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
                    Immich Swipe
                </h1>
                <p className="text-xs text-zinc-500 mt-1">v1.0.0</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setViewMode(item.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === item.id
                                ? 'bg-amber-500/10 text-amber-500 font-medium'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Stats Area */}
            <div className="p-4 mt-auto">
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5 space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <HardDrive size={18} />
                        <span className="text-sm font-medium">Storage Saved</span>
                    </div>

                    <div>
                        <p className="text-xs text-zinc-500 mb-1">This Week</p>
                        <p className="text-lg font-mono font-bold text-white">{formatBytes(stats.thisWeek)}</p>
                    </div>

                    <div className="pt-3 border-t border-white/5">
                        <p className="text-xs text-zinc-500 mb-1">Lifetime</p>
                        <p className="text-sm font-mono text-zinc-300">{formatBytes(stats.total)}</p>
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-black uppercase">
                        {user?.email?.[0] || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut size={16} />
                    Log Out
                </button>
            </div>
        </div>
    );
};
