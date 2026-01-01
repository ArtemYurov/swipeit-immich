import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, SlideInLeft, SlideOutLeft, FadeIn, FadeOut } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { StorageStats } from './StorageStats';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, logout } = useAuth();

    if (!isOpen) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Backdrop */}
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                <View
                    style={styles.backdrop}
                />
            </Pressable>

            {/* Drawer */}
            <View
                style={styles.drawer}
            >
                <LinearGradient
                    colors={['#18181b', '#09090b']}
                    style={styles.gradient}
                >
                    {/* Header / User Info */}
                    <View style={styles.header}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || 'U'}</Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User'}</Text>
                            <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.separator} />

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.sectionTitle}>Immich Swipe</Text>

                        <View style={{ marginTop: 20 }}>
                            <StorageStats />
                        </View>

                        {/* Add more menu items here if needed */}
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={20} color="#71717a" />
                            <Text style={styles.infoText}>Version 1.0.0 (Mobile)</Text>
                        </View>
                    </View>

                    {/* Footer / Logout */}
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
        width: SIDEBAR_WIDTH,
        height: '100%',
        backgroundColor: '#18181b',
        borderRightWidth: 1,
        borderRightColor: '#27272a',
        zIndex: 100,
    },
    gradient: {
        flex: 1,
        paddingTop: 60, // Safe area
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f59e0b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 18,
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    userEmail: {
        color: '#a1a1aa',
        fontSize: 12,
    },
    closeButton: {
        padding: 4,
    },
    separator: {
        height: 1,
        backgroundColor: '#27272a',
        marginBottom: 20,
    },
    content: {
        flex: 1,
    },
    sectionTitle: {
        color: '#71717a',
        textTransform: 'uppercase',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 'auto',
        marginBottom: 20,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
    },
    infoText: {
        color: '#71717a',
        fontSize: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        gap: 8,
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
