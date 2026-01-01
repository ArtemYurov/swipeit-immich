import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSwipe } from '@/context/SwipeContext';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 3; // 3 columns

interface ReviewBinModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReviewBinModal({ isOpen, onClose }: ReviewBinModalProps) {
    const { trashQueue, restoreFromTrash, emptyTrash } = useSwipe();
    const { serverUrl, accessToken } = useAuth();

    const renderItem = ({ item }: { item: typeof trashQueue[0] }) => {
        return (
            <View style={styles.card}>
                <Image
                    source={{
                        uri: `${serverUrl}/api/assets/${item.id}/thumbnail?format=JPEG`,
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'x-api-key': accessToken || ''
                        }
                    }}
                    style={styles.image}
                    contentFit="cover"
                />
                <View style={styles.overlay} />
                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={() => restoreFromTrash(item.id)}
                >
                    <Ionicons name="refresh" size={16} color="#4ade80" />
                    <Text style={styles.restoreText}>Restore</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)' }]} />
                )}

                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleContainer}>
                            <View style={styles.iconBg}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </View>
                            <View>
                                <Text style={styles.title}>Review Bin</Text>
                                <Text style={styles.subtitle}>{trashQueue.length} items to delete</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    {/* Grid */}
                    {trashQueue.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-circle-outline" size={64} color="#52525b" />
                            <Text style={styles.emptyText}>Bin is empty</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={trashQueue}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            contentContainerStyle={styles.grid}
                            columnWrapperStyle={{ gap: 8 }}
                        />
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        {trashQueue.length > 0 && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => {
                                    emptyTrash();
                                    onClose();
                                }}
                            >
                                <Ionicons name="trash" size={16} color="#fff" />
                                <Text style={styles.deleteText}>Delete ({trashQueue.length})</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        height: '85%',
        backgroundColor: '#18181b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#71717a',
    },
    closeButton: {
        padding: 4,
    },
    grid: {
        padding: 16,
    },
    card: {
        width: CARD_WIDTH,
        aspectRatio: 0.75,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#27272a',
        marginBottom: 8,
    },
    image: {
        width: '100%',
        height: '100%',
        opacity: 0.7,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(127, 29, 29, 0.2)',
    },
    restoreButton: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    restoreText: {
        color: '#4ade80',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        color: '#71717a',
        fontSize: 16,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        gap: 16,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 16,
    },
    cancelText: {
        color: '#a1a1aa',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 2,
        backgroundColor: '#ef4444',
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        gap: 8,
    },
    deleteText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
