
import React, { useEffect } from 'react';
import { useSwipe } from '../context/SwipeContext';
import { useAuth } from '../context/AuthContext';
import { User, ImageOff } from 'lucide-react';
import { Person } from '@/types/immich';
import { motion } from 'framer-motion';

export const PeopleGrid = () => {
    const { people, setSelectedPerson, isLoading, fetchPeople, setAlbumId, setSelectedMonth } = useSwipe();
    // const { serverUrl, accessToken } = useAuth(); // Not needed with proxy

    useEffect(() => {
        fetchPeople();
    }, [fetchPeople]);

    const getThumbnailUrl = (person: Person) => {
        if (!person.thumbnailPath) return null;
        return `/api/proxy/people/${person.id}/thumbnail?format=JPEG`;
    };

    const handlePersonClick = (person: Person) => {
        setAlbumId(null);
        setSelectedMonth(null);
        setSelectedPerson(person.id);
    };

    if (isLoading && people.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
                <p>Finding faces...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 pb-32">
            {people.map((person, index) => (
                <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handlePersonClick(person)}
                    className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-zinc-900 border border-white/5 cursor-pointer hover:border-amber-500/50 transition-colors"
                >
                    {person.thumbnailPath ? (
                        <img
                            src={getThumbnailUrl(person)!}
                            alt={person.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                            <User className="w-12 h-12 text-zinc-600" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-medium truncate text-lg">
                            {person.name || "Unknown Person"}
                        </h3>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
