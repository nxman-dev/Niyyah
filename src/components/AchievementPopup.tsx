import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';
import { usePrayers } from '../context/PrayerContext';
import { BADGES } from '../constants/Badges';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function AchievementPopup() {
    const { newBadge, clearNewBadge, showCelebration } = usePrayers();
    const confettiRef = useRef<ConfettiCannon>(null);

    useEffect(() => {
        if (newBadge && !showCelebration) { // Only start if celebration is NOT showing
            confettiRef.current?.start();
        }
    }, [newBadge, showCelebration]);

    // If celebration is active, HIDE this popup completely
    if (showCelebration) return null;

    if (!newBadge) return null;

    const earnedBadgeDetails = BADGES.find(b => b.id === newBadge);

    return (
        <Modal transparent visible={!!newBadge} animationType="fade">
            <View style={styles.modalOverlay}>
                <ConfettiCannon
                    count={200}
                    origin={{ x: width / 2, y: 0 }}
                    autoStart={true}
                    ref={confettiRef}
                    fadeOut={true}
                />
                <View style={styles.modalContent}>
                    <View style={styles.trophyContainer}>
                        <Ionicons name="trophy" size={60} color="#F6AD55" />
                    </View>
                    <Text style={styles.modalTitle}>Congratulations!</Text>
                    <Text style={styles.modalSubtitle}>You earned a new badge!</Text>

                    {earnedBadgeDetails && (
                        <View style={styles.earnedBadgePreview}>
                            <earnedBadgeDetails.icon size={48} color={earnedBadgeDetails.color} />
                            <Text style={[styles.badgeTitle, { marginTop: 8 }]}>{earnedBadgeDetails.title}</Text>
                            <Text style={styles.badgeDesc}>{earnedBadgeDetails.description}</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.closeButton} onPress={clearNewBadge}>
                        <Text style={styles.closeButtonText}>Alhamdulillah</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    trophyContainer: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        color: Colors.textLight,
        marginBottom: 24,
        textAlign: 'center',
    },
    earnedBadgePreview: {
        alignItems: 'center',
        marginBottom: 32,
        padding: 20,
        backgroundColor: Colors.background,
        borderRadius: 16,
        width: '100%',
    },
    badgeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    badgeDesc: {
        fontSize: 13,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 4,
    },
    closeButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
