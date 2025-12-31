import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import { SwipeProvider, useSwipe } from '@/context/SwipeContext';
import { AlbumGrid } from '@/components/AlbumGrid';
import { SwipeCard } from '@/components/SwipeCard';
import { SwipeButtons } from '@/components/SwipeButtons';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

function SwipeInterface() {
    const { queue, handleSwipe, handleUndo, history, isLoading, albumId, setAlbumId, remainingCount } = useSwipe();
    const { logout, serverUrl, accessToken } = useAuth();

    // Prefetch upcoming images
    useEffect(() => {
        if (!serverUrl || !accessToken || queue.length <= 1) return;

        // Prefetch next 3 images in queue
        const prefetchImages = async () => {
            const nextAssets = queue.slice(1, 4);
            for (const asset of nextAssets) {
                const isHeic = asset.originalFileName.toLowerCase().endsWith('.heic') ||
                    asset.originalFileName.toLowerCase().endsWith('.heif');
                const url = isHeic
                    ? `${serverUrl}/api/assets/${asset.id}/thumbnail?format=JPEG`
                    : `${serverUrl}/api/assets/${asset.id}/original`;

                try {
                    await ExpoImage.prefetch(url, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'x-api-key': accessToken
                        }
                    });
                } catch (e) {
                    // Ignore prefetch errors
                }
            }
        };

        prefetchImages();
    }, [queue, serverUrl, accessToken]);

    // Stats
    const keptCount = history.filter(h => h.action === 'KEEP').length;
    const deletedCount = history.filter(h => h.action === 'DELETE').length;

    // If no album selected, show grid
    if (!albumId) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                {/* Header */}
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <Ionicons name="log-out-outline" size={20} color="#71717a" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
                <AlbumGrid />
            </View>
        );
    }

    // Loading state
    if (queue.length === 0 && isLoading) {
        return (
            <View style={styles.centerContainer}>
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text style={styles.loadingText}>Loading photos...</Text>
            </View>
        );
    }

    // Empty state
    if (queue.length === 0 && !isLoading) {
        return (
            <View style={styles.centerContainer}>
                <StatusBar style="light" />
                <View style={styles.doneIcon}>
                    <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
                </View>
                <Text style={styles.doneTitle}>All caught up!</Text>
                <Text style={styles.doneSubtitle}>No more photos in this album to review.</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => setAlbumId(null)}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                    <Text style={styles.backButtonText}>Choose Another Album</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Current asset for background
    const currentAsset = queue[0];

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Ambient Background */}
            {currentAsset && (
                <Animated.View
                    entering={FadeIn.duration(500)}
                    exiting={FadeOut.duration(300)}
                    style={styles.ambientBackground}
                >
                    <Image
                        source={{ uri: `${serverUrl}/api/assets/${currentAsset.id}/thumbnail?format=JPEG` }}
                        style={styles.ambientImage}
                        blurRadius={50}
                    />
                    <View style={styles.ambientOverlay} />
                </Animated.View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backChip} onPress={() => setAlbumId(null)}>
                    <Ionicons name="arrow-back" size={18} color="#fff" />
                    <Text style={styles.backChipText}>Library</Text>
                </TouchableOpacity>
            </View>

            {/* Main Card Area */}
            <View style={styles.cardContainer}>
                {queue.length > 0 && (
                    <Animated.View
                        key={queue[0].id}
                        entering={FadeIn.duration(200)}
                    >
                        <SwipeCard
                            asset={queue[0]}
                            onSwipe={handleSwipe}
                        />
                    </Animated.View>
                )}
            </View>

            {/* Footer Controls */}
            <View style={styles.footer}>
                <SwipeButtons
                    onSwipeLeft={() => handleSwipe('left')}
                    onSwipeRight={() => handleSwipe('right')}
                    onUndo={handleUndo}
                    canUndo={history.length > 0}
                    remainingCount={remainingCount}
                    keptCount={keptCount}
                    deletedCount={deletedCount}
                />
            </View>
        </View>
    );
}

// Wrapper with Provider
export default function HomeScreen() {
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isLoading, isAuthenticated]);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#f59e0b" />
            </View>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <SwipeProvider>
            <SwipeInterface />
        </SwipeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#71717a',
        marginTop: 16,
        fontSize: 16,
    },
    headerRight: {
        position: 'absolute',
        top: 50,
        right: 16,
        zIndex: 100,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    logoutText: {
        color: '#71717a',
        fontSize: 14,
    },
    // Swipe View
    ambientBackground: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
    },
    ambientImage: {
        width: '100%',
        height: '100%',
        transform: [{ scale: 1.2 }],
    },
    ambientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    backChipText: {
        color: '#fff',
        fontSize: 14,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    footer: {
        paddingBottom: 20,
    },
    // Done state
    doneIcon: {
        marginBottom: 24,
    },
    doneTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    doneSubtitle: {
        fontSize: 16,
        color: '#71717a',
        marginBottom: 32,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 999,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
});
