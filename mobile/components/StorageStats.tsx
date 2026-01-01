import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSwipe } from '@/context/SwipeContext';
import { formatBytes } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const StorageStats = () => {
    const { stats } = useSwipe();

    if (stats.thisWeek === 0 && stats.total === 0) return null;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                <View style={styles.headerRow}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="server-outline" size={20} color="#34d399" />
                    </View>
                    <View style={styles.titleContainer}>
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>Storage Saved</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Weekly</Text>
                            </View>
                        </View>
                        <Text style={styles.subtitle}>
                            You've cleaned <Text style={styles.highlight}>{formatBytes(stats.thisWeek)}</Text> this week!
                        </Text>
                    </View>
                </View>

                {stats.total > 0 && (
                    <View style={styles.footer}>
                        <Text style={styles.footerLabel}>Lifetime</Text>
                        <Text style={styles.footerValue}>{formatBytes(stats.total)}</Text>
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 153, 0.2)',
    },
    gradient: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(52, 211, 153, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    badge: {
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 153, 0.2)',
    },
    badgeText: {
        fontSize: 10,
        color: '#34d399',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 13,
        color: '#a1a1aa',
    },
    highlight: {
        color: '#fff',
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: 12,
        color: '#71717a',
    },
    footerValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#34d399',
        fontFamily: 'monospace',
    },
});
