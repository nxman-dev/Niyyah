import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, Platform, KeyboardAvoidingView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import OnboardingProgressBar from '../../components/OnboardingProgressBar';

export default function UsernameScreen({ navigation }: any) {
    const [username, setUsername] = useState('');

    const handleNext = () => {
        if (username.length < 3) {
            Alert.alert('Error', 'Username must be at least 3 characters long.');
            return;
        }
        navigation.navigate('InitialTimes', { username });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <OnboardingProgressBar progress={0.5} />

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="rocket-outline" size={60} color={Colors.primary} />
                    </View>

                    <Text style={styles.title}>Let's start your journey!</Text>
                    <Text style={styles.subtitle}>What should we call you?</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Your Name"
                            placeholderTextColor={Colors.textLight}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="words"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.spacer} />

                    <TouchableOpacity
                        style={[styles.button, username.length < 3 && styles.buttonDisabled]}
                        onPress={handleNext}
                        disabled={username.length < 3}
                    >
                        <Text style={styles.buttonText}>CONTINUE</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, padding: 24, alignItems: 'center' },
    iconContainer: { marginBottom: 24, marginTop: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginBottom: 40 },

    inputContainer: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    input: { fontSize: 18, color: Colors.text, textAlign: 'center', fontWeight: 'bold' },

    spacer: { flex: 1 },

    button: {
        width: '100%',
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
        borderBottomWidth: 4,
        borderBottomColor: '#2C7A7B', // Darker teal for 3D effect
    },
    buttonDisabled: {
        backgroundColor: Colors.border,
        borderBottomColor: '#CBD5E0',
    },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
