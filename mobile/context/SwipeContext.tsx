import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { ImmichAsset, SwipeAction, ImmichAlbum } from '@/types/immich';
import { useAuth } from './AuthContext';

export type ViewMode = 'albums' | 'timeline';

export interface MonthGroup {
    key: string; // e.g., "2024-12"
    label: string; // e.g., "December 2024"
    count: number;
    coverAssetId: string | null;
}

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
    // Timeline features
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    monthGroups: MonthGroup[];
    selectedMonth: string | null;
    setSelectedMonth: (month: string | null) => void;
    fetchTimeline: () => Promise<void>;
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
    // Timeline defaults
    viewMode: 'albums',
    setViewMode: () => { },
    monthGroups: [],
    selectedMonth: null,
    setSelectedMonth: () => { },
    fetchTimeline: async () => { },
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

    // Timeline state
    const [viewMode, setViewMode] = useState<ViewMode>('albums');
    const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

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

    // Fetch timeline: get ALL photos and group by month (with pagination)
    const fetchTimeline = useCallback(async () => {
        if (monthGroups.length > 0) return; // Already fetched
        setIsLoading(true);
        try {
            let allAssets: ImmichAsset[] = [];
            let page = 1;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data } = await api.post('/search/metadata', {
                    isTrashed: false,
                    isArchived: false,
                    type: 'IMAGE',
                    withExif: true,
                    isVisible: true,
                    order: 'desc',
                    page: page,
                    size: pageSize,
                });

                let assets: ImmichAsset[] = [];
                if (Array.isArray(data)) {
                    assets = data;
                } else if (data.assets?.items) {
                    assets = data.assets.items;
                } else if (data.items) {
                    assets = data.items;
                }

                allAssets = [...allAssets, ...assets];
                console.log(`Fetched page ${page}: ${assets.length} assets (total: ${allAssets.length})`);

                if (assets.length < pageSize) {
                    hasMore = false;
                } else {
                    page++;
                }

                if (page > 100) {
                    console.warn('Reached max page limit');
                    hasMore = false;
                }
            }

            console.log(`Total assets for timeline: ${allAssets.length}`);

            // Group by month
            const groups: Record<string, { assets: ImmichAsset[]; coverAssetId: string | null }> = {};

            for (const asset of allAssets) {
                const date = new Date(asset.localDateTime || asset.fileCreatedAt);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!groups[key]) {
                    groups[key] = { assets: [], coverAssetId: asset.id };
                }
                groups[key].assets.push(asset);
            }

            const monthGroupsArr: MonthGroup[] = Object.entries(groups)
                .map(([key, value]) => {
                    const [year, month] = key.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1);
                    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                    return {
                        key,
                        label,
                        count: value.assets.length,
                        coverAssetId: value.coverAssetId,
                    };
                })
                .sort((a, b) => b.key.localeCompare(a.key));

            setMonthGroups(monthGroupsArr);
        } catch (e) {
            console.error('Failed to fetch timeline', e);
        } finally {
            setIsLoading(false);
        }
    }, [monthGroups.length]);

    // Load albums on auth
    useEffect(() => {
        if (isAuthenticated) {
            fetchAlbums();
        }
    }, [isAuthenticated, fetchAlbums]);

    // Reset everything when album or month changes
    useEffect(() => {
        setQueue([]);
        setHistory([]);
        setMasterAssets([]);
        loadingRef.current = false;
    }, [albumId, selectedMonth]);

    // Derived State
    const currentAlbum = albums.find(a => a.id === albumId);
    const totalAssetsCount = currentAlbum ? currentAlbum.assetCount : masterAssets.length;
    const remainingCount = Math.max(0, totalAssetsCount - history.length);

    // Load album or month assets
    useEffect(() => {
        const loadAssets = async () => {
            if ((!albumId && !selectedMonth) || loadingRef.current || masterAssets.length > 0) return;

            loadingRef.current = true;
            setIsLoading(true);

            try {
                let assets: ImmichAsset[] = [];

                if (albumId) {
                    // Fetch by album
                    const { data } = await api.post('/search/metadata', {
                        albumIds: [albumId],
                        isTrashed: false,
                        isArchived: false,
                        type: 'IMAGE',
                        withExif: true,
                        isVisible: true,
                    });
                    assets = Array.isArray(data) ? data : (data.assets?.items || []);
                    console.log(`Loaded ${assets.length} assets for album ${albumId}`);
                } else if (selectedMonth) {
                    // Fetch by month using date range
                    const [year, month] = selectedMonth.split('-').map(Number);
                    const startDate = new Date(year, month - 1, 1);
                    const endDate = new Date(year, month, 0, 23, 59, 59);

                    const { data } = await api.post('/search/metadata', {
                        isTrashed: false,
                        isArchived: false,
                        type: 'IMAGE',
                        withExif: true,
                        isVisible: true,
                        takenAfter: startDate.toISOString(),
                        takenBefore: endDate.toISOString(),
                    });
                    assets = Array.isArray(data) ? data : (data.assets?.items || []);
                    console.log(`Loaded ${assets.length} assets for month ${selectedMonth}`);
                }

                setMasterAssets(assets);
                setQueue(assets.slice(0, 20));
            } catch (error) {
                console.error('Failed to fetch assets', error);
            } finally {
                setIsLoading(false);
                loadingRef.current = false;
            }
        };

        if ((albumId || selectedMonth) && masterAssets.length === 0) {
            loadAssets();
        }
    }, [albumId, selectedMonth, masterAssets.length]);

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
            // Timeline features
            viewMode,
            setViewMode,
            monthGroups,
            selectedMonth,
            setSelectedMonth,
            fetchTimeline,
        }}>
            {children}
        </SwipeContext.Provider>
    );
};
