"use client";

import { ImmichAsset, SwipeAction } from "@/types/immich";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineProps {
    history: SwipeAction[];
    queue: ImmichAsset[];
}

export function Timeline({ history, queue }: TimelineProps) {
    // Get last 5 history items (reversed to show newest closest to center if we want, or standard timeline)
    // History[0] is the MOST RECENT action.
    // We want to show: [Oldest ... Newest] [Current] [Next ... Future]
    // So we take history.slice(0, 5) and REVERSE it to display left-to-right chronological.
    const recentHistory = history.slice(0, 5).reverse();

    // Get next 5 items from queue.
    // queue[0] is the current card (active). 
    // queue[1] is the NEXT card.
    // So we show queue.slice(1, 6).
    const upcomingQueue = queue.slice(1, 6);

    const getThumbnailUrl = (id: string) => `/api/proxy/assets/${id}/thumbnail?format=JPEG`;

    return (
        <div className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/5 mx-auto max-w-fit overflow-hidden">

            {/* HISTORY TRAIL */}
            <div className="flex items-center gap-2">
                <AnimatePresence mode="popLayout">
                    {recentHistory.map((action) => (
                        <motion.div
                            key={action.asset.id}
                            initial={{ opacity: 0, scale: 0, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 ${action.action === 'KEEP' ? 'border-green-500' : 'border-red-500'
                                }`}
                        >
                            <img
                                src={getThumbnailUrl(action.asset.id)}
                                alt="History"
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* SEPARATOR / CURRENT INDICATOR */}
            <div className="w-1 h-8 bg-zinc-700 rounded-full mx-2" />

            {/* UPCOMING TRAIL */}
            <div className="flex items-center gap-2">
                <AnimatePresence mode="popLayout">
                    {upcomingQueue.map((asset) => (
                        <motion.div
                            key={asset.id}
                            initial={{ opacity: 0, scale: 0, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10"
                        >
                            <img
                                src={getThumbnailUrl(asset.id)}
                                alt="Upcoming"
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
