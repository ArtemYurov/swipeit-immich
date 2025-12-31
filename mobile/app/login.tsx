import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
    const { login, loginWithToken } = useAuth();
    const [serverUrl, setServerUrl] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [useToken, setUseToken] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!serverUrl.trim()) {
            Alert.alert('Error', 'Please enter your Immich server URL');
            return;
        }

        if (useToken) {
            if (!accessToken.trim()) {
                Alert.alert('Error', 'Please enter your access token');
                return;
            }
            try {
                setIsLoading(true);
                await loginWithToken(serverUrl, accessToken);
            } catch (error: any) {
                Alert.alert('Error', 'Failed to connect. Please check your server URL and token.');
            } finally {
                setIsLoading(false);
            }
        } else {
            if (!email.trim() || !password.trim()) {
                Alert.alert('Error', 'Please enter email and password');
                return;
            }
            try {
                setIsLoading(true);
                await login(serverUrl, email, password);
            } catch (error: any) {
                Alert.alert('Login Failed', error.response?.data?.message || 'Please check your credentials');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="light" />
            <LinearGradient
                colors={['#18181b', '#000']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="images" size={40} color="#f59e0b" />
                    </View>
                    <Text style={styles.title}>Immich Swipe</Text>
                    <Text style={styles.subtitle}>Photo review, made simple</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Server URL */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="server-outline" size={20} color="#71717a" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Server URL (e.g. http://192.168.1.100:2283)"
                            placeholderTextColor="#52525b"
                            value={serverUrl}
                            onChangeText={setServerUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                        />
                    </View>

                    {/* Auth Method Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleButton, !useToken && styles.toggleButtonActive]}
                            onPress={() => setUseToken(false)}
                        >
                            <Text style={[styles.toggleText, !useToken && styles.toggleTextActive]}>Email/Password</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, useToken && styles.toggleButtonActive]}
                            onPress={() => setUseToken(true)}
                        >
                            <Text style={[styles.toggleText, useToken && styles.toggleTextActive]}>Access Token</Text>
                        </TouchableOpacity>
                    </View>

                    {useToken ? (
                        <View style={styles.inputContainer}>
                            <Ionicons name="key-outline" size={20} color="#71717a" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Access Token"
                                placeholderTextColor="#52525b"
                                value={accessToken}
                                onChangeText={setAccessToken}
                                autoCapitalize="none"
                                secureTextEntry
                            />
                        </View>
                    ) : (
                        <>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#71717a" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#52525b"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#71717a" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Password"
                                    placeholderTextColor="#52525b"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#71717a"
                                    />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>Connect</Text>
                                <Ionicons name="arrow-forward" size={20} color="#000" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#71717a',
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    toggleText: {
        color: '#71717a',
        fontSize: 14,
        fontWeight: '500',
    },
    toggleTextActive: {
        color: '#fff',
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f59e0b',
        borderRadius: 16,
        paddingVertical: 16,
        marginTop: 8,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
});
