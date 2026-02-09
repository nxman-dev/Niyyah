import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { usePrayers } from '../context/PrayerContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function CelebrationOverlay() {
    const { showCelebration, closeCelebration } = usePrayers();
    const confettiRef = useRef<ConfettiCannon>(null);

    useEffect(() => {
        if (showCelebration) {
            console.log("[CelebrationOverlay] Showing celebration!");
            if (confettiRef.current) {
                confettiRef.current.start();
            }
        }
    }, [showCelebration]);

    if (!showCelebration) return null;

    return (
        <Modal visible={showCelebration} transparent animationType="fade">
            <View style={styles.container}>
                <ConfettiCannon
                    ref={confettiRef}
                    count={200}
                    origin={{ x: width / 2, y: -20 }}
                    autoStart={true}
                    fadeOut={true}
                    fallSpeed={3000}
                />

                <View style={styles.card}>
                    <Text style={styles.title}>Mubarak!</Text>
                    <Text style={styles.message}>You completed all 5 prayers today.</Text>

                    <TouchableOpacity style={styles.button} onPress={closeCelebration}>
                        <Text style={styles.buttonText}>Alhamdulillah</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999, // Ensure it's on top
    },
    card: {
        width: '80%',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 8,
        fontFamily: 'Inter_700Bold',
    },
    message: {
        fontSize: 16,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: 'Inter_400Regular',
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 30,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
});
