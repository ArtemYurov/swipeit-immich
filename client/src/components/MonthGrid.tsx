"use client";

import { useSwipe, MonthGroup } from "@/context/SwipeContext";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Image as ImageIcon, Camera, ArrowRight, Calendar } from 'lucide-react';

export function MonthGrid() {
    const { monthGroups, setSelectedMonth, isLoading, fetchTimeline, setAlbumId } = useSwipe();

    // Fetch timeline on mount
    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    const getCoverUrl = (assetId: string | null) => {
        if (!assetId) return null;
        return `/api/proxy/assets/${assetId}/thumbnail?format=JPEG`;
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const handleMonthClick = (month: MonthGroup) => {
        // Clear albumId to ensure month-based loading
        setAlbumId(null);
        setSelectedMonth(month.key);
    };

    if (isLoading && monthGroups.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-white/50">
                Loading timeline...
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pb-20"
        >
            {monthGroups.map((month) => (
                <motion.div
                    key={month.key}
                    variants={item}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleMonthClick(month)}
                    className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5"
                >
                    {/* Background Image / Cover */}
                    {month.coverAssetId ? (
                        <img
                            src={getCoverUrl(month.coverAssetId)!}
                            alt={month.label}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                            loading="lazy"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-600">
                            <ImageIcon className="w-12 h-12" />
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-1">
                            <Calendar className="w-3 h-3" />
                        </div>
                        <h3 className="text-white font-medium text-lg truncate group-hover:text-amber-200 transition-colors">
                            {month.label}
                        </h3>
                        <div className="flex items-center space-x-2 text-zinc-400 text-sm mt-1">
                            <Camera className="w-3 h-3" />
                            <span>{month.count} photos</span>
                        </div>
                    </div>

                    {/* Hover Action Indicator */}
                    <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
