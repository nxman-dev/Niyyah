import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions, Modal, TouchableOpacity, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { BADGES, Badge } from '../constants/Badges';
import { usePrayers } from '../context/PrayerContext';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function AchievementsScreen() {
    const { earnedBadges, newBadge, clearNewBadge, getBadgeProgress } = usePrayers();
    const confettiRef = useRef<ConfettiCannon>(null);
    const [hasError, setHasError] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    useEffect(() => {
        if (newBadge && !hasError) {
            try {
                confettiRef.current?.start();
            } catch (e) {
                console.log("Confetti Error", e);
            }
        }
    }, [newBadge, hasError]);

    if (hasError) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.title}>Something went wrong.</Text>
                <Text style={styles.subtitle}>Please restart the app.</Text>
            </SafeAreaView>
        );
    }

    const handleShare = async (badge: Badge) => {
        const message = `I just earned the "${badge.title}" badge on Niyyah! 🌙✨\n\n${badge.description}`;

        if (Platform.OS === 'web') {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'New Achievement Unlocked!',
                        text: message,
                        url: window.location.href // Optional: link to app
                    });
                } catch (error) {
                    console.log('Error sharing:', error);
                }
            } else {
                // Fallback to Clipboard
                try {
                    await navigator.clipboard.writeText(message);
                    alert('Achievement copied to clipboard! Share it with your friends.');
                } catch (err) {
                    alert('Could not copy to clipboard. You earned: ' + badge.title);
                }
            }
        } else {
            try {
                await Share.share({
                    message: message,
                });
            } catch (error) {
                console.log(error);
            }
        }
    };

    const renderBadge = ({ item }: { item: Badge }) => {
        try {
            const isEarned = earnedBadges?.has(item.id) ?? false;
            const Icon = item.icon;
            const { current, total } = getBadgeProgress(item.id);
            const progress = Math.min(1, Math.max(0, current / (total || 1)));

            return (
                <TouchableOpacity
                    style={[styles.badgeCard, isEarned ? styles.badgeUnlocked : styles.badgeLocked]}
                    onPress={() => setSelectedBadge(item)}
                    activeOpacity={0.9}
                >
                    <View style={[styles.iconCircle, isEarned ? { backgroundColor: item.color } : { backgroundColor: '#E2E8F0' }]}>
                        <Icon color={isEarned ? "#FFF" : "#A0AEC0"} size={32} />
                    </View>

                    <Text style={[styles.badgeTitle, !isEarned && { color: Colors.textLight }]}>{item.title}</Text>

                    {isEarned ? (
                        <View style={styles.earnedTag}>
                            <Text style={styles.earnedText}>Unlocked</Text>
                        </View>
                    ) : (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{current}/{total}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            );
        } catch (e) {
            console.error("Render Badge Error", e);
            return null;
        }
    };

    const totalEarned = earnedBadges?.size || 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Achievements</Text>
                <Text style={styles.subtitle}>{totalEarned} / {BADGES.length} Unlocked</Text>
            </View>

            {totalEarned === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="star-outline" size={48} color={Colors.textLight} />
                    <Text style={styles.emptyStateText}>Start praying to earn your first badge!</Text>
                </View>
            )}

            <FlatList
                data={BADGES}
                renderItem={renderBadge}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
            />

            {/* Details Modal */}
            <Modal transparent visible={!!selectedBadge} animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedBadge(null)}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        {selectedBadge && (
                            <>
                                <View style={[
                                    styles.modalIconCircle,
                                    { backgroundColor: earnedBadges?.has(selectedBadge.id) ? selectedBadge.color : '#CBD5E0' },
                                    earnedBadges?.has(selectedBadge.id) && styles.glowEffect
                                ]}>
                                    <selectedBadge.icon size={48} color="#FFF" />
                                </View>
                                <Text style={styles.modalTitle}>{selectedBadge.title}</Text>
                                <Text style={styles.modalSubtitle}>{selectedBadge.description}</Text>

                                {earnedBadges?.has(selectedBadge.id) ? (
                                    <View style={styles.modalTag}>
                                        <Ionicons name="checkmark-circle" size={16} color="white" />
                                        <Text style={styles.modalTagText}>Earned</Text>
                                    </View>
                                ) : (
                                    <View style={styles.modalProgress}>
                                        <Text style={styles.progressText}>
                                            {getBadgeProgress(selectedBadge.id).current} / {selectedBadge.requirement} to unlock
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(selectedBadge)}>
                                    <Ionicons name="share-social-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.shareButtonText}>Share Achievement</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedBadge(null)}>
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Victory Popup (New Badge) */}
            <Modal transparent visible={!!newBadge} animationType="fade" onRequestClose={clearNewBadge}>
                <View style={styles.modalOverlay}>
                    {!!newBadge && (
                        <ConfettiCannon
                            count={200}
                            origin={{ x: width / 2, y: 0 }}
                            autoStart={true}
                            ref={confettiRef}
                            fadeOut={true}
                            fallSpeed={3000}
                        />
                    )}
                    {/* ... (Existing New Badge Content Logic could be reused or simplified, keeping as fits) */}
                    {/* For brevity, using similar structure to Details modal but for New Badge */}
                    {/* Actually, user didn't ask to change this, just update global trigger. I will keep existing logic if possible. */}
                    {/* WAIT, I am replacing the whole file. I need to re-include the Victory Popup content. */}
                    <View style={styles.modalContent}>
                        <View style={styles.trophyContainer}>
                            <Ionicons name="trophy" size={60} color="#F6AD55" />
                        </View>
                        <Text style={styles.modalTitle}>Congratulations!</Text>
                        <Text style={styles.modalSubtitle}>You earned a new badge!</Text>
                        {/* Display logic for newBadge */}
                        {newBadge && (() => {
                            const b = BADGES.find(x => x.id === newBadge);
                            if (!b) return null;
                            return (
                                <View style={styles.earnedBadgePreview}>
                                    <b.icon size={48} color={b.color} />
                                    <Text style={[styles.badgeTitle, { marginTop: 8 }]}>{b.title}</Text>
                                </View>
                            )
                        })()}
                        <TouchableOpacity style={[styles.closeButton, { marginTop: 24 }]} onPress={clearNewBadge}>
                            <Text style={styles.closeButtonText}>Awesome!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { padding: 24, paddingBottom: 12 },
    title: { fontSize: 32, fontWeight: 'bold', color: Colors.text },
    subtitle: { fontSize: 16, color: Colors.textLight, marginTop: 4 },
    listContent: { padding: 24 },

    badgeCard: {
        width: ITEM_WIDTH,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: Colors.surface,
        position: 'relative',
    },
    badgeUnlocked: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderBottomWidth: 4,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    badgeLocked: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        opacity: 0.9,
    },
    iconCircle: {
        width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    badgeTitle: {
        fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8,
    },
    earnedTag: {
        backgroundColor: '#E6FFFA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    earnedText: { fontSize: 12, color: '#319795', fontWeight: 'bold' },

    progressContainer: { width: '100%', alignItems: 'center', marginTop: 8 },
    progressBarBg: {
        width: '100%', height: 8, backgroundColor: '#EDF2F7', borderRadius: 4, marginBottom: 4, overflow: 'hidden'
    },
    progressBarFill: { height: '100%', backgroundColor: '#319795', borderRadius: 4 },
    progressText: { fontSize: 11, color: Colors.textLight, fontWeight: '600' },

    // Modal Styles
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 360,
    },
    modalIconCircle: {
        width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    glowEffect: {
        shadowColor: "#F6AD55",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginBottom: 24 },
    modalTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 24 },
    modalTagText: { color: 'white', fontWeight: 'bold', marginLeft: 4 },
    modalProgress: { marginBottom: 24 },
    shareButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    shareButtonText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    closeButton: { width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: '#EDF2F7', alignItems: 'center' },
    closeButtonText: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },

    // Legacy / Shared
    emptyState: { alignItems: 'center', padding: 40, opacity: 0.8 },
    emptyStateText: { marginTop: 12, fontSize: 16, color: Colors.textLight, textAlign: 'center' },
    trophyContainer: { marginBottom: 16 },
    earnedBadgePreview: {
        alignItems: 'center', marginBottom: 24, padding: 16, backgroundColor: Colors.background, borderRadius: 16, width: '100%'
    },
});
