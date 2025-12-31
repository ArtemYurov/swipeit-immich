"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { ImmichAsset, SwipeAction } from '@/types/immich';
import { useAuth } from './AuthContext';

export interface ImmichAlbum {
    id: string;
    albumName: string;
    assetCount: number;
    albumThumbnailAssetId: string | null;
}

interface SwipeContextType {
    queue: ImmichAsset[];
    history: SwipeAction[];
    isLoading: boolean;
    loadMore: () => Promise<void>;
    handleSwipe: (direction: 'left' | 'right') => Promise<void>;
    handleUndo: () => Promise<void>;
    currentAsset: ImmichAsset | null;
    albumId: string | null;
    setAlbumId: (id: string | null) => void;
    albums: ImmichAlbum[];
    fetchAlbums: () => Promise<void>;
    remainingCount: number;
}

const SwipeContext = createContext<SwipeContextType>({
    queue: [],
    history: [],
    isLoading: false,
    loadMore: async () => { },
    handleSwipe: async () => { },
    handleUndo: async () => { },
    currentAsset: null,
    albumId: null,
    setAlbumId: () => { },
    albums: [],
    fetchAlbums: async () => { },
    remainingCount: 0,
});

export const useSwipe = () => useContext(SwipeContext);

export const SwipeProvider = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const [queue, setQueue] = useState<ImmichAsset[]>([]);
    const [history, setHistory] = useState<SwipeAction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [albumId, setAlbumId] = useState<string | null>(null);
    const [albums, setAlbums] = useState<ImmichAlbum[]>([]);
    // Master list of ALL assets in the current album
    const [masterAssets, setMasterAssets] = useState<ImmichAsset[]>([]);
    const loadingRef = useRef(false);

    const fetchAlbums = useCallback(async () => {
        try {
            const { data } = await api.get('/albums');
            setAlbums(data);
        } catch (e) {
            console.error("Failed to fetch albums", e);
        }
    }, []);

    // Load albums on auth
    useEffect(() => {
        if (isAuthenticated) {
            fetchAlbums();
        }
    }, [isAuthenticated, fetchAlbums]);

    // Reset everything when album changes
    useEffect(() => {
        setQueue([]);
        setHistory([]);
        setMasterAssets([]);
        loadingRef.current = false; // allow new fetch
    }, [albumId]);

    // Derived State
    // Use the Album's metadata count if available for accuracy (search might be capped at 250?)
    // Fallback to masterAssets length if album search fails or is weird.
    const currentAlbum = albums.find(a => a.id === albumId);

    // Total count logic:
    // If we have album metadata, use that (it's the Source of Truth from Immich).
    // Otherwise fall back to what we downloaded.
    const totalAssetsCount = currentAlbum ? currentAlbum.assetCount : masterAssets.length;

    // Remaining = Total - Processed(History)
    // Ensure we don't go negative
    const remainingCount = Math.max(0, totalAssetsCount - history.length);

    // Initial Load of Album Assets
    useEffect(() => {
        const loadAlbumAssets = async () => {
            if (!albumId || loadingRef.current || masterAssets.length > 0) return;

            loadingRef.current = true;
            setIsLoading(true);

            try {
                // Fetch ALL assets for the album to get accurate count
                const { data } = await api.post('/search/metadata', {
                    albumIds: [albumId],
                    isTrashed: false,
                    isArchived: false,
                    type: 'IMAGE',
                    withExif: true, // Need dimensions
                    isVisible: true,
                });

                const assets: ImmichAsset[] = Array.isArray(data) ? data : (data.assets?.items || []);
                console.log(`Loaded ${assets.length} assets for album ${albumId}`);

                setMasterAssets(assets);

                // Initialize Queue with first 20 items
                // Filter out any that might already be in history (if we persisted history, which we don't currently)
                setQueue(assets.slice(0, 20));

            } catch (error) {
                console.error("Failed to fetch assets", error);
            } finally {
                setIsLoading(false);
                // We keep loadingRef true if we are "done" to prevent re-fetching the master list? 
                // Actually, if we want to "load more" (pagination), we would need a different logic.
                // But /search/metadata usually returns all or a huge chunk. 
                // For V1 let's assume it returns all.
                loadingRef.current = false;
            }
        };

        if (albumId && masterAssets.length === 0) {
            loadAlbumAssets();
        }
    }, [albumId, masterAssets.length]);


    // Queue Refill Management
    // As queue gets low, pull next batch from masterAssets
    useEffect(() => {
        if (queue.length < 5 && masterAssets.length > 0) {
            // Find where we are
            // Queue contains [Index K ... Index K+N]
            // We need to look at what we have in history + queue to know what's next?
            // Simpler: Maintain a 'currentIndex' or filter.

            // Re-sync queue from master based on history
            const historyIds = new Set(history.map(h => h.asset.id));
            const nextBatch = masterAssets.filter(a => !historyIds.has(a.id)).slice(0, 20);

            // Only update if different
            if (nextBatch.length > 0 && (queue.length === 0 || nextBatch[0].id !== queue[0].id)) {
                // Prevent infinite loop if queue is just full of the same items
                // If nextBatch is effectively what we already have, don't set.

                // Simpler approach: Just use one big state? No, queue is for performance.
                // Let's just blindly replenish from the remaining pool
                setQueue(nextBatch);
            }
        }
    }, [queue.length, masterAssets, history]); // Dependencies need care


    const handleSwipe = async (direction: 'left' | 'right') => {
        const asset = queue[0];
        if (!asset) return;

        // Optimistic Update
        const nextQueue = queue.slice(1);
        setQueue(nextQueue);

        const actionType = direction === 'left' ? 'DELETE' : 'KEEP';
        const action: SwipeAction = {
            asset: asset,
            action: actionType,
            timestamp: Date.now(),
        };

        setHistory((prev) => [action, ...prev]);

        if (direction === 'left') {
            try {
                await api.delete('/assets', { data: { ids: [asset.id] } });
            } catch (e) {
                console.error("Failed to delete asset", e);
            }
        }

        // Refill logic handled by useEffect
    };

    const handleUndo = async () => {
        const lastAction = history[0];
        if (!lastAction) return;

        setHistory((prev) => prev.slice(1));

        if (lastAction.action === 'DELETE') {
            try {
                await api.post('/trash/restore/assets', { ids: [lastAction.asset.id] });
            } catch (e) {
                console.error("Failed to restore", e);
            }
        }

        // Put back in queue at the TOP
        setQueue(prev => [lastAction.asset, ...prev]);
    };

    return (
        <SwipeContext.Provider value={{
            queue,
            history,
            isLoading,
            loadMore: async () => { }, // Deprecated internal use
            handleSwipe,
            handleUndo,
            currentAsset: queue[0] || null,
            albumId,
            setAlbumId,
            albums,
            fetchAlbums,
            remainingCount // Exported new property
        }}>
            {children}
        </SwipeContext.Provider>
    )
};
