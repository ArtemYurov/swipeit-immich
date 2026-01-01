import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSwipe, ViewMode } from '@/context/SwipeContext';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MonthGrid } from './MonthGrid';
import { PeopleGrid } from './PeopleGrid';
import { StorageStats } from './StorageStats';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export function AlbumGrid({ onMenuPress }: { onMenuPress: () => void }) {
    const { albums, setAlbumId, isLoading, fetchAlbums, viewMode, setViewMode } = useSwipe();
    const { serverUrl, accessToken } = useAuth();

    const getCoverUrl = (assetId: string | null) => {
        if (!assetId || !serverUrl) return null;
        return `${serverUrl}/api/assets/${assetId}/thumbnail?format=JPEG`;
    };

    const renderAlbum = ({ item }: { item: typeof albums[0] }) => (
        <TouchableOpacity
            style={styles.albumCard}
            onPress={() => setAlbumId(item.id)}
            activeOpacity={0.8}
        >
            {item.albumThumbnailAssetId ? (
                <Image
                    source={{
                        uri: getCoverUrl(item.albumThumbnailAssetId)!,
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'x-api-key': accessToken || ''
                        }
                    }}
                    style={styles.albumCover}
                    contentFit="cover"
                />
            ) : (
                <View style={styles.placeholderCover}>
                    <Ionicons name="images-outline" size={40} color="#52525b" />
                </View>
            )}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />
            <View style={styles.albumInfo}>
                <Text style={styles.albumName} numberOfLines={1}>{item.albumName}</Text>
                <View style={styles.countContainer}>
                    <Ionicons name="camera-outline" size={12} color="#a1a1aa" />
                    <Text style={styles.albumCount}>{item.assetCount} photos</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <TouchableOpacity onPress={onMenuPress} style={{ padding: 4 }}>
                        <Ionicons name="menu" size={24} color="#f4f4f5" />
                    </TouchableOpacity>
                    <Text style={[styles.title, { marginBottom: 0 }]}>Your Library</Text>
                </View>

                <Text style={styles.subtitle}>
                    Select {viewMode === 'albums' ? 'an album' : viewMode === 'timeline' ? 'a month' : 'a person'} to start swiping
                </Text>

                {/* View Mode Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'albums' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('albums')}
                    >
                        <Ionicons name="folder-outline" size={16} color={viewMode === 'albums' ? '#f59e0b' : '#71717a'} />
                        <Text style={[styles.toggleText, viewMode === 'albums' && styles.toggleTextActive]}>Albums</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'timeline' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('timeline')}
                    >
                        <Ionicons name="calendar-outline" size={16} color={viewMode === 'timeline' ? '#f59e0b' : '#71717a'} />
                        <Text style={[styles.toggleText, viewMode === 'timeline' && styles.toggleTextActive]}>Timeline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'people' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('people')}
                    >
                        <Ionicons name="people-outline" size={16} color={viewMode === 'people' ? '#f59e0b' : '#71717a'} />
                        <Text style={[styles.toggleText, viewMode === 'people' && styles.toggleTextActive]}>People</Text>
                    </TouchableOpacity>
                </View>
            </View>



            {/* Content Area */}
            {viewMode === 'timeline' ? (
                <MonthGrid />
            ) : viewMode === 'people' ? (
                <PeopleGrid />
            ) : (
                isLoading && albums.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#f59e0b" />
                        <Text style={styles.loadingText}>Loading library...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={albums}
                        renderItem={renderAlbum}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        contentContainerStyle={styles.grid}
                        showsVerticalScrollIndicator={false}
                        onRefresh={fetchAlbums}
                        refreshing={isLoading}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: 60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#71717a',
        marginTop: 12,
        fontSize: 16,
    },
    header: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#71717a',
        marginBottom: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    toggleButtonActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    toggleText: {
        color: '#71717a',
        fontSize: 14,
        fontWeight: '500',
    },
    toggleTextActive: {
        color: '#f59e0b',
    },
    grid: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    albumCard: {
        width: CARD_WIDTH,
        aspectRatio: 1,
        marginRight: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    albumCover: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    placeholderCover: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#27272a',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
    },
    albumInfo: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    albumName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    countContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    albumCount: {
        color: '#a1a1aa',
        fontSize: 12,
    },
});

