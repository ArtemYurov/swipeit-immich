"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSwipe, SwipeProvider } from '@/context/SwipeContext'; // Note: SwipeProvider wrapper needed
import { AssetCard } from '@/components/AssetCard';
import { AlbumGrid } from '@/components/AlbumGrid';
import { ImmichAsset } from '@/types/immich';

import { Button } from '@/components/ui/button';
import { Undo2, Check, X, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';

function SwipeInterface() {
  const { queue, handleSwipe, handleUndo, history, isLoading, albumId, setAlbumId, remainingCount, selectedMonth, setSelectedMonth } = useSwipe();
  const { logout } = useAuth();

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!albumId && !selectedMonth) return; // Disable swipe keys if in library view
      if (e.key === 'ArrowLeft') handleSwipe('left');
      if (e.key === 'ArrowRight') handleSwipe('right');
      if (e.key === 'Escape') {
        setAlbumId(null);
        setSelectedMonth(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipe, albumId, selectedMonth, setAlbumId, setSelectedMonth]);

  // If no album or month selected, show grid
  if (!albumId && !selectedMonth) {
    return (
      <div className="relative flex h-screen w-full flex-col bg-black overflow-hidden">
        {/* Header / Nav */}
        <div className="absolute top-0 right-0 p-6 z-50">
          <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <AlbumGrid />
      </div>
    );
  }

  // SWIPE VIEW
  if (queue.length === 0 && isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 font-light">Loading photos...</span>
      </div>
    )
  }

  if (queue.length === 0 && !isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white space-y-6">
        <div className="bg-zinc-900/50 p-8 rounded-full">
          <Check className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">All caught up!</h2>
        <p className="text-zinc-400">No more photos to review.</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => { setAlbumId(null); setSelectedMonth(null); }}>Back to Library</Button>
          <Button variant="ghost" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    )
  }

  // Only render needed items
  // Flanking logic handled separately below

  // Stats
  const keptCount = history.filter(h => h.action === 'KEEP').length;
  const deletedCount = history.filter(h => h.action === 'DELETE').length;

  // Current active asset for background
  const currentAsset = queue[0];
  const nextAsset = queue[1];
  const prevAction = history[0];

  return (
    <div className="relative flex h-screen w-full flex-col items-center bg-black overflow-hidden selection:bg-none">

      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {currentAsset && (
          <motion.div
            key={currentAsset.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="w-full h-full"
          >
            <img
              src={`/api/proxy/assets/${currentAsset.id}/thumbnail?format=JPEG`}
              className="w-full h-full object-cover blur-3xl scale-110"
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        )}
      </div>

      {/* HEADER: Navigation & Stats */}
      <div className="relative w-full z-50 flex items-center justify-between px-6 py-4 md:px-8 md:py-6">
        <Button variant="ghost" className="rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-white/10 hover:text-white transition-all" onClick={() => { setAlbumId(null); setSelectedMonth(null); }}>
          <Undo2 className="mr-2 h-4 w-4" />
          Library
        </Button>

        {/* Stats (Moved to Header) */}
        <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 mx-auto absolute left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
            <span className="text-white/90 font-mono text-sm">{deletedCount}</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-white/90 font-mono text-sm">{keptCount}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={handleUndo} disabled={history.length === 0} className="text-white/80 hover:bg-white/10 hover:text-white rounded-full transition-all">
          <Undo2 className="h-6 w-6" />
        </Button>
      </div>


      {/* MAIN STAGE */}
      <div className="relative flex-1 w-full flex items-center justify-center z-10 perspective-[1000px]">

        {/* PREVIOUS PREVIEW (Left Anchor) */}
        <div className="absolute left-0 h-full flex items-center pl-4 md:pl-12 opacity-0 md:opacity-100 pointer-events-none">
          {prevAction && (
            <div className="relative w-[100px] md:w-[200px] h-[30vh] rounded-xl overflow-hidden opacity-30 blur-[2px] transform scale-90 transition-all duration-500">
              <img src={`/api/proxy/assets/${prevAction.asset.id}/thumbnail?format=JPEG`} className="w-full h-full object-cover grayscale" />
              <div className={`absolute inset-0 border-2 ${prevAction.action === 'KEEP' ? 'border-green-500/50' : 'border-red-500/50'}`} />
            </div>
          )}
        </div>

        {/* NEXT PREVIEW (Right Anchor) - Desktop Only */}
        <div className="absolute right-0 h-full flex items-center pr-4 md:pr-12 opacity-0 md:opacity-100 pointer-events-none">
          {nextAsset && (
            <div className="relative w-[100px] md:w-[200px] h-[30vh] rounded-xl overflow-hidden opacity-30 blur-[2px] transform scale-90 transition-all duration-500">
              <img src={`/api/proxy/assets/${nextAsset.id}/thumbnail?format=JPEG`} className="w-full h-full object-cover grayscale" />
            </div>
          )}
        </div>

        {/* CENTER CARD (Interactive) */}
        <AnimatePresence mode="wait">
          {queue.length > 0 && (
            <motion.div
              key={queue[0].id}
              className="z-30 absolute inset-0 flex items-center justify-center p-4"
              initial={{ scale: 0.92, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{
                duration: 0.35,
                ease: [0.25, 0.1, 0.25, 1], // Smooth cubic-bezier
              }}
            >
              <AssetCard
                asset={queue[0]}
                onSwipe={handleSwipe}
                index={0}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER: Controls */}
      <div className="w-full pb-8 z-50 flex flex-col items-center gap-6 h-[15vh] justify-end">

        {/* Control Buttons (Minimal) */}
        <div className="flex items-center justify-center gap-12 md:gap-24 w-full">
          <Button
            size="lg"
            variant="ghost"
            className="rounded-full h-16 w-16 md:h-20 md:w-20 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:scale-105 transition-all duration-300"
            onClick={() => handleSwipe('left')}
          >
            <X className="h-8 w-8 md:h-10 md:w-10" />
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Remaining</span>
            <span className="text-white font-mono text-xl">{remainingCount}</span>
          </div>

          <Button
            size="lg"
            variant="ghost"
            className="rounded-full h-16 w-16 md:h-20 md:w-20 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 hover:scale-105 transition-all duration-300"
            onClick={() => handleSwipe('right')}
          >
            <Check className="h-8 w-8 md:h-10 md:w-10" />
          </Button>
        </div>

      </div>
    </div>
  );
}

// Wrapper with Provider
export default function Page() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <SwipeProvider>
      <SwipeInterface />
    </SwipeProvider>
  )
}
