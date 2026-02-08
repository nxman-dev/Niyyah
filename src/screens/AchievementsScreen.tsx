import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions, Modal, TouchableOpacity, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { BADGES, Badge } from '../constants/Badges';
import { usePrayers } from '../context/PrayerContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function AchievementsScreen() {
    const { earnedBadges, newBadge, clearNewBadge, getBadgeProgress } = usePrayers();
    const { colors, isDark } = useTheme();
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
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
                <Text style={[styles.title, { color: colors.text }]}>Something went wrong.</Text>
                <Text style={[styles.subtitle, { color: colors.textLight }]}>Please restart the app.</Text>
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
                        url: window.location.href
                    });
                } catch (error) {
                    console.log('Error sharing:', error);
                }
            } else {
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

    // Dynamic Styles for items
    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        title: { color: colors.text },
        subtitle: { color: colors.textLight },
        badgeCard: { backgroundColor: colors.surface, shadowOpacity: isDark ? 0 : 0.15 },
        badgeTitle: { color: colors.text },
        badgeLockedBorder: { borderColor: colors.border },
        modalContent: { backgroundColor: colors.surface },
        modalTitle: { color: colors.text },
        modalSubtitle: { color: colors.textLight },
        modalCloseBtn: { backgroundColor: isDark ? colors.background : '#EDF2F7', color: colors.text },
        emptyStateText: { color: colors.textLight }
    };

    const renderBadge = ({ item }: { item: Badge }) => {
        try {
            const isEarned = earnedBadges?.has(item.id) ?? false;
            const Icon = item.icon;
            const { current, total } = getBadgeProgress(item.id);
            const progress = Math.min(1, Math.max(0, current / (total || 1)));

            return (
                <TouchableOpacity
                    style={[
                        styles.badgeCard,
                        dynamicStyles.badgeCard,
                        isEarned ? styles.badgeUnlocked : [styles.badgeLocked, dynamicStyles.badgeLockedBorder]
                    ]}
                    onPress={() => setSelectedBadge(item)}
                    activeOpacity={0.9}
                >
                    <View style={[styles.iconCircle, isEarned ? { backgroundColor: item.color } : { backgroundColor: isDark ? colors.background : '#E2E8F0' }]}>
                        <Icon color={isEarned ? "#FFF" : colors.textLight} size={32} />
                    </View>

                    <Text style={[styles.badgeTitle, dynamicStyles.badgeTitle, !isEarned && { color: colors.textLight }]}>{item.title}</Text>

                    {isEarned ? (
                        <View style={[styles.earnedTag, { backgroundColor: isDark ? 'rgba(49, 151, 149, 0.2)' : '#E6FFFA' }]}>
                            <Text style={styles.earnedText}>Unlocked</Text>
                        </View>
                    ) : (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.background : '#EDF2F7' }]}>
                                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                            </View>
                            <Text style={[styles.progressText, { color: colors.textLight }]}>{current}/{total}</Text>
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
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <View style={styles.header}>
                <Text style={[styles.title, dynamicStyles.title]}>Achievements</Text>
                <Text style={[styles.subtitle, dynamicStyles.subtitle]}>{totalEarned} / {BADGES.length} Unlocked</Text>
            </View>

            {totalEarned === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="star-outline" size={48} color={colors.textLight} />
                    <Text style={[styles.emptyStateText, dynamicStyles.emptyStateText]}>Start praying to earn your first badge!</Text>
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
                    <View style={[styles.modalContent, dynamicStyles.modalContent]} onStartShouldSetResponder={() => true}>
                        {selectedBadge && (
                            <>
                                <View style={[
                                    styles.modalIconCircle,
                                    { backgroundColor: earnedBadges?.has(selectedBadge.id) ? selectedBadge.color : (isDark ? colors.background : '#CBD5E0') },
                                    earnedBadges?.has(selectedBadge.id) && styles.glowEffect
                                ]}>
                                    <selectedBadge.icon size={48} color="#FFF" />
                                </View>
                                <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>{selectedBadge.title}</Text>
                                <Text style={[styles.modalSubtitle, dynamicStyles.modalSubtitle]}>{selectedBadge.description}</Text>

                                {earnedBadges?.has(selectedBadge.id) ? (
                                    <View style={styles.modalTag}>
                                        <Ionicons name="checkmark-circle" size={16} color="white" />
                                        <Text style={styles.modalTagText}>Earned</Text>
                                    </View>
                                ) : (
                                    <View style={styles.modalProgress}>
                                        <Text style={[styles.progressText, { color: colors.textLight }]}>
                                            {getBadgeProgress(selectedBadge.id).current} / {selectedBadge.requirement} to unlock
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(selectedBadge)}>
                                    <Ionicons name="share-social-outline" size={20} color={colors.primary} />
                                    <Text style={[styles.shareButtonText, { color: colors.primary }]}>Share Achievement</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.closeButton, { backgroundColor: dynamicStyles.modalCloseBtn.backgroundColor }]} onPress={() => setSelectedBadge(null)}>
                                    <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Victory Popup (New Badge) */}
            <Modal transparent visible={!!newBadge} animationType="fade" onRequestClose={clearNewBadge}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
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
                    <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                        <View style={styles.trophyContainer}>
                            <Ionicons name="trophy" size={60} color="#F6AD55" />
                        </View>
                        <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Congratulations!</Text>
                        <Text style={[styles.modalSubtitle, dynamicStyles.modalSubtitle]}>You earned a new badge!</Text>
                        {/* Display logic for newBadge */}
                        {newBadge && (() => {
                            const b = BADGES.find(x => x.id === newBadge);
                            if (!b) return null;
                            return (
                                <View style={[styles.earnedBadgePreview, { backgroundColor: colors.background }]}>
                                    <b.icon size={48} color={b.color} />
                                    <Text style={[styles.badgeTitle, { marginTop: 8, color: colors.text }]}>{b.title}</Text>
                                </View>
                            )
                        })()}
                        <TouchableOpacity style={[styles.closeButton, { marginTop: 24, backgroundColor: colors.primary }]} onPress={clearNewBadge}>
                            <Text style={[styles.closeButtonText, { color: 'white' }]}>Awesome!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 24, paddingBottom: 12 },
    title: { fontSize: 32, fontWeight: 'bold' },
    subtitle: { fontSize: 16, marginTop: 4 },
    listContent: { padding: 24 },

    badgeCard: {
        width: ITEM_WIDTH,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    badgeUnlocked: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 5,
        borderBottomWidth: 4,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    badgeLocked: {
        borderWidth: 2,
        opacity: 0.9,
    },
    iconCircle: {
        width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    badgeTitle: {
        fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 8,
    },
    earnedTag: {
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    earnedText: { fontSize: 12, color: '#319795', fontWeight: 'bold' },

    progressContainer: { width: '100%', alignItems: 'center', marginTop: 8 },
    progressBarBg: {
        width: '100%', height: 8, borderRadius: 4, marginBottom: 4, overflow: 'hidden'
    },
    progressBarFill: { height: '100%', backgroundColor: '#319795', borderRadius: 4 },
    progressText: { fontSize: 11, fontWeight: '600' },

    // Modal Styles
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    modalContent: {
        borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 360,
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
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
    modalTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#319795', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 24 },
    modalTagText: { color: 'white', fontWeight: 'bold', marginLeft: 4 },
    modalProgress: { marginBottom: 24 },
    shareButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    shareButtonText: { fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    closeButton: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    closeButtonText: { fontWeight: 'bold', fontSize: 16 },

    // Legacy / Shared
    emptyState: { alignItems: 'center', padding: 40, opacity: 0.8 },
    emptyStateText: { marginTop: 12, fontSize: 16, textAlign: 'center' },
    trophyContainer: { marginBottom: 16 },
    earnedBadgePreview: {
        alignItems: 'center', marginBottom: 24, padding: 16, borderRadius: 16, width: '100%'
    },
});
