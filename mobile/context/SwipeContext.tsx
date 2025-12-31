import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { ImmichAsset, SwipeAction, ImmichAlbum } from '@/types/immich';
import { useAuth } from './AuthContext';

interface SwipeContextType {
    queue: ImmichAsset[];
    history: SwipeAction[];
    isLoading: boolean;
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
    const [masterAssets, setMasterAssets] = useState<ImmichAsset[]>([]);
    const loadingRef = useRef(false);

    const fetchAlbums = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/albums');
            setAlbums(data);
        } catch (e) {
            console.error('Failed to fetch albums', e);
        } finally {
            setIsLoading(false);
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
        loadingRef.current = false;
    }, [albumId]);

    // Derived State
    const currentAlbum = albums.find(a => a.id === albumId);
    const totalAssetsCount = currentAlbum ? currentAlbum.assetCount : masterAssets.length;
    const remainingCount = Math.max(0, totalAssetsCount - history.length);

    // Load album assets
    useEffect(() => {
        const loadAlbumAssets = async () => {
            if (!albumId || loadingRef.current || masterAssets.length > 0) return;

            loadingRef.current = true;
            setIsLoading(true);

            try {
                const { data } = await api.post('/search/metadata', {
                    albumIds: [albumId],
                    isTrashed: false,
                    isArchived: false,
                    type: 'IMAGE',
                    withExif: true,
                    isVisible: true,
                });

                const assets: ImmichAsset[] = Array.isArray(data) ? data : (data.assets?.items || []);
                console.log(`Loaded ${assets.length} assets for album ${albumId}`);

                setMasterAssets(assets);
                setQueue(assets.slice(0, 20));
            } catch (error) {
                console.error('Failed to fetch assets', error);
            } finally {
                setIsLoading(false);
                loadingRef.current = false;
            }
        };

        if (albumId && masterAssets.length === 0) {
            loadAlbumAssets();
        }
    }, [albumId, masterAssets.length]);

    // Queue refill
    useEffect(() => {
        if (queue.length < 5 && masterAssets.length > 0) {
            const historyIds = new Set(history.map(h => h.asset.id));
            const nextBatch = masterAssets.filter(a => !historyIds.has(a.id)).slice(0, 20);

            if (nextBatch.length > 0 && (queue.length === 0 || nextBatch[0].id !== queue[0].id)) {
                setQueue(nextBatch);
            }
        }
    }, [queue.length, masterAssets, history]);

    const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
        const asset = queue[0];
        if (!asset) return;

        // Optimistic update
        const nextQueue = queue.slice(1);
        setQueue(nextQueue);

        const actionType = direction === 'left' ? 'DELETE' : 'KEEP';
        const action: SwipeAction = {
            asset,
            action: actionType,
            timestamp: Date.now(),
        };

        setHistory(prev => [action, ...prev]);

        if (direction === 'left') {
            try {
                await api.delete('/assets', { data: { ids: [asset.id] } });
            } catch (e) {
                console.error('Failed to delete asset', e);
            }
        }
    }, [queue]);

    const handleUndo = useCallback(async () => {
        const lastAction = history[0];
        if (!lastAction) return;

        setHistory(prev => prev.slice(1));

        if (lastAction.action === 'DELETE') {
            try {
                await api.post('/trash/restore/assets', { ids: [lastAction.asset.id] });
            } catch (e) {
                console.error('Failed to restore', e);
            }
        }

        setQueue(prev => [lastAction.asset, ...prev]);
    }, [history]);

    return (
        <SwipeContext.Provider value={{
            queue,
            history,
            isLoading,
            handleSwipe,
            handleUndo,
            currentAsset: queue[0] || null,
            albumId,
            setAlbumId,
            albums,
            fetchAlbums,
            remainingCount,
        }}>
            {children}
        </SwipeContext.Provider>
    );
};
