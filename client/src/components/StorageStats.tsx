import React from 'react';
import { motion } from 'framer-motion';
import { Database, TrendingUp, HardDrive } from 'lucide-react';
import { useSwipe } from '@/context/SwipeContext';

function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const StorageStats = () => {
    const { stats } = useSwipe();

    if (stats.thisWeek === 0 && stats.total === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto mb-8"
        >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/20 backdrop-blur-md p-0.5">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-50" />

                <div className="relative flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                            <HardDrive className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Storage Saver
                                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                                    Weekly
                                </span>
                            </h3>
                            <p className="text-emerald-200/70 text-sm">
                                You've cleaned <span className="text-white font-bold">{formatBytes(stats.thisWeek)}</span> this week!
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:block text-right">
                        <p className="text-xs text-zinc-400 mb-1">Lifetime Saved</p>
                        <p className="text-xl font-mono font-bold text-emerald-400">{formatBytes(stats.total)}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
