import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSwipe, MonthGroup } from '@/context/SwipeContext';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export function MonthGrid() {
    const { monthGroups, setSelectedMonth, setAlbumId, isLoading, fetchTimeline } = useSwipe();
    const { serverUrl, accessToken } = useAuth();

    // Fetch timeline on mount
    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    const getCoverUrl = (assetId: string | null) => {
        if (!assetId || !serverUrl) return null;
        return `${serverUrl}/api/assets/${assetId}/thumbnail?format=JPEG`;
    };

    const handleMonthPress = (month: MonthGroup) => {
        setAlbumId(null); // Clear album to use month
        setSelectedMonth(month.key);
    };

    if (isLoading && monthGroups.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text style={styles.loadingText}>Loading timeline...</Text>
            </View>
        );
    }

    const renderMonth = ({ item }: { item: MonthGroup }) => (
        <TouchableOpacity
            style={styles.monthCard}
            onPress={() => handleMonthPress(item)}
            activeOpacity={0.8}
        >
            {item.coverAssetId ? (
                <Image
                    source={{
                        uri: getCoverUrl(item.coverAssetId)!,
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'x-api-key': accessToken || ''
                        }
                    }}
                    style={styles.monthCover}
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
            <View style={styles.monthInfo}>
                <View style={styles.calendarIcon}>
                    <Ionicons name="calendar-outline" size={12} color="#f59e0b" />
                </View>
                <Text style={styles.monthName} numberOfLines={1}>{item.label}</Text>
                <View style={styles.countContainer}>
                    <Ionicons name="camera-outline" size={12} color="#a1a1aa" />
                    <Text style={styles.monthCount}>{item.count} photos</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={monthGroups}
            renderItem={renderMonth}
            keyExtractor={(item) => item.key}
            numColumns={2}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            onRefresh={fetchTimeline}
            refreshing={isLoading}
        />
    );
}

const styles = StyleSheet.create({
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
    grid: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    monthCard: {
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
    monthCover: {
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
    monthInfo: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    calendarIcon: {
        marginBottom: 4,
    },
    monthName: {
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
    monthCount: {
        color: '#a1a1aa',
        fontSize: 12,
    },
});
