import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, X, CheckCheck } from 'lucide-react';
import { useSwipe } from '../context/SwipeContext';
import { Button } from '@/components/ui/button';

interface ReviewBinModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReviewBinModal: React.FC<ReviewBinModalProps> = ({ isOpen, onClose }) => {
    const { trashQueue, restoreFromTrash, emptyTrash } = useSwipe();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Review Bin</h2>
                                <p className="text-sm text-zinc-400">{trashQueue.length} items to delete</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                            <X className="w-5 h-5 text-zinc-400" />
                        </Button>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-[300px]">
                        {trashQueue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                                <CheckCheck className="w-12 h-12 opacity-20" />
                                <p>Bin is empty. Good to go!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {trashQueue.map((asset) => (
                                    <div key={asset.id} className="relative group aspect-[3/4] rounded-xl overflow-hidden bg-black/50 border border-white/5">
                                        <img
                                            src={`/api/proxy/assets/${asset.id}/thumbnail?format=JPEG`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                            alt="Deleted"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-red-900/60 to-transparent opacity-60" />

                                        {/* Overlay Actions */}
                                        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex justify-center bg-black/40 backdrop-blur-sm">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-white hover:text-green-400 hover:bg-white/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    restoreFromTrash(asset.id);
                                                }}
                                            >
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Restore
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex justify-between items-center gap-4">
                        <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">
                            Cancel
                        </Button>
                        {trashQueue.length > 0 && (
                            <Button
                                variant="destructive"
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => {
                                    emptyTrash();
                                    onClose();
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete ({trashQueue.length})
                            </Button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
