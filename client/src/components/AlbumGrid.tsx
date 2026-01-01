"use client";

import { useSwipe, ImmichAlbum, ViewMode } from "@/context/SwipeContext";
import { MonthGrid } from "./MonthGrid";
import { PeopleGrid } from "./PeopleGrid";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
// Lucide icons
import { Image as ImageIcon, Camera, ArrowRight, Clock, FolderOpen, Calendar, Users } from 'lucide-react';

export function AlbumGrid() {
    const { albums, setAlbumId, isLoading, viewMode, setViewMode } = useSwipe();

    // Use proxy for album covers
    const getCoverUrl = (assetId: string | null) => {
        if (!assetId) return null;
        return `/api/proxy/assets/${assetId}/thumbnail?format=JPEG`;
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (isLoading && albums.length === 0 && viewMode === 'albums') {
        return (
            <div className="flex h-full w-full items-center justify-center text-white/50">
                Loading library...
            </div>
        )
    }

    return (
        <div className="h-full w-full overflow-y-auto p-6 md:p-12">
            <header className="mb-8 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 mb-4">
                    Your Library
                </h1>
                <p className="text-zinc-400 text-lg mb-6">
                    Select {viewMode === 'albums' ? 'an album' : viewMode === 'people' ? 'a person' : 'a month'} to start swiping.
                </p>

                {/* View Mode Toggle */}
                <div className="inline-flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setViewMode('albums')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'albums'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <FolderOpen className="w-4 h-4" />
                        Albums
                    </button>
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'timeline'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Timeline
                    </button>
                    <button
                        onClick={() => setViewMode('people')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'people'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        People
                    </button>
                </div>
            </header>

            {/* Conditional Grid Rendering */}
            {viewMode === 'timeline' ? (
                <MonthGrid />
            ) : viewMode === 'people' ? (
                <PeopleGrid />
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pb-20"
                >
                    {albums.map((album) => (
                        <motion.div
                            key={album.id}
                            variants={item}
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setAlbumId(album.id)}
                            className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5"
                        >
                            {/* Background Image / Cover */}
                            {album.albumThumbnailAssetId ? (
                                <img
                                    src={getCoverUrl(album.albumThumbnailAssetId)!}
                                    alt={album.albumName}
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
                                <h3 className="text-white font-medium text-lg truncate group-hover:text-amber-200 transition-colors">
                                    {album.albumName}
                                </h3>
                                <div className="flex items-center space-x-2 text-zinc-400 text-sm mt-1">
                                    <Camera className="w-3 h-3" />
                                    <span>{album.assetCount} photos</span>
                                </div>
                            </div>

                            {/* Hover Action Indicator */}
                            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                <ArrowRight className="w-5 h-5 text-white" />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}

