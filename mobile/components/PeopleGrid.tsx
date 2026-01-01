import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSwipe } from '@/context/SwipeContext';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3;

export function PeopleGrid() {
    const { people, setSelectedPerson, isLoading, fetchPeople } = useSwipe();
    const { serverUrl, accessToken } = useAuth();

    useEffect(() => {
        fetchPeople();
    }, [fetchPeople]);

    const getThumbnailUrl = (item: typeof people[0]) => {
        if (!serverUrl || !item.thumbnailPath) return null;
        // thumbnailPath in Immich is usually /api/people/.../thumbnail
        // API usually returns relative path "/api/..." or just string?
        // Web logic used `/api/proxy/people/...` due to some proxy logic.
        // But for mobile direct api access: `${serverUrl}/api/people/${item.id}/thumbnail`
        return `${serverUrl}/api/people/${item.id}/thumbnail?format=JPEG`;
    };

    const renderPerson = ({ item }: { item: typeof people[0] }) => (
        <TouchableOpacity
            style={styles.personCard}
            onPress={() => setSelectedPerson(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {item.thumbnailPath ? (
                    <Image
                        source={{
                            uri: getThumbnailUrl(item)!,
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'x-api-key': accessToken || ''
                            }
                        }}
                        style={styles.thumbnail}
                        contentFit="cover"
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="person" size={32} color="#52525b" />
                    </View>
                )}
            </View>
            <Text style={styles.name} numberOfLines={1}>{item.name || 'Unknown'}</Text>
        </TouchableOpacity>
    );

    if (isLoading && people.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f59e0b" />
            </View>
        );
    }

    return (
        <FlatList
            data={people}
            renderItem={renderPerson}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    grid: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    personCard: {
        width: CARD_WIDTH,
        marginRight: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    imageContainer: {
        width: CARD_WIDTH,
        height: CARD_WIDTH,
        borderRadius: CARD_WIDTH / 2,
        overflow: 'hidden',
        marginBottom: 8,
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#27272a',
    },
    name: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
