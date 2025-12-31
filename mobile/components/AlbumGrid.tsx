import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSwipe } from '@/context/SwipeContext';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export function AlbumGrid() {
    const { albums, setAlbumId, isLoading, fetchAlbums } = useSwipe();
    const { serverUrl, accessToken } = useAuth();

    const getCoverUrl = (assetId: string | null) => {
        if (!assetId || !serverUrl) return null;
        return `${serverUrl}/api/assets/${assetId}/thumbnail?format=JPEG`;
    };

    if (isLoading && albums.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text style={styles.loadingText}>Loading library...</Text>
            </View>
        );
    }

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
                            'x-api-key': accessToken
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
                <Text style={styles.title}>Your Library</Text>
                <Text style={styles.subtitle}>Select an album to start swiping</Text>
            </View>
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
        marginBottom: 24,
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
