import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SwipeButtonsProps {
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    onUndo: () => void;
    canUndo: boolean;
    remainingCount: number;
    keptCount: number;
    deletedCount: number;
}

export function SwipeButtons({
    onSwipeLeft,
    onSwipeRight,
    onUndo,
    canUndo,
    remainingCount,
    keptCount,
    deletedCount,
}: SwipeButtonsProps) {
    return (
        <View style={styles.container}>
            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
                    <Text style={styles.statValue}>{deletedCount}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{keptCount}</Text>
                    <View style={[styles.statDot, { backgroundColor: '#22c55e' }]} />
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsRow}>
                <TouchableOpacity
                    style={[styles.mainButton, styles.deleteButton]}
                    onPress={onSwipeLeft}
                    activeOpacity={0.8}
                >
                    <Ionicons name="close" size={36} color="#ef4444" />
                </TouchableOpacity>

                <View style={styles.centerInfo}>
                    <Text style={styles.remainingLabel}>REMAINING</Text>
                    <Text style={styles.remainingValue}>{remainingCount}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.mainButton, styles.keepButton]}
                    onPress={onSwipeRight}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark" size={36} color="#22c55e" />
                </TouchableOpacity>
            </View>

            {/* Undo Button */}
            <TouchableOpacity
                style={[styles.undoButton, !canUndo && styles.undoButtonDisabled]}
                onPress={onUndo}
                disabled={!canUndo}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-undo" size={20} color={canUndo ? '#fff' : '#52525b'} />
                <Text style={[styles.undoText, !canUndo && styles.undoTextDisabled]}>Undo</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingBottom: 40,
        paddingTop: 20,
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 999,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statValue: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'monospace',
        fontSize: 14,
    },
    divider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 16,
    },
    buttonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 40,
        marginBottom: 20,
    },
    mainButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    keepButton: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    centerInfo: {
        alignItems: 'center',
    },
    remainingLabel: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10,
        letterSpacing: 2,
        fontWeight: '700',
    },
    remainingValue: {
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 24,
        marginTop: 4,
    },
    undoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    undoButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    undoText: {
        color: '#fff',
        fontSize: 14,
    },
    undoTextDisabled: {
        color: '#52525b',
    },
});
