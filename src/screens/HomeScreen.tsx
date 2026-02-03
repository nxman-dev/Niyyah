import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { usePrayers } from '../context/PrayerContext';
import { hasTimePassed } from '../constants/PrayerTimes';
import AnimatedPrayerCard from '../components/AnimatedPrayerCard';
import CircularProgress from '../components/CircularProgress';
import AchievementPopup from '../components/AchievementPopup';

import { useAuth } from '../context/AuthContext';
import { getDailyQuote } from '../constants/Quotes';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
    const { prayers, streak, markAsPrayed, isLoading, getToDaysRatio, refreshTodayPrayers, resetData } = usePrayers();
    const { profile, isLoading: isAuthLoading, profileStatus, refreshProfile } = useAuth();
    const { completed, total } = getToDaysRatio();

    // Entering Animation
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 800 });
        translateY.value = withTiming(0, { duration: 800 });
    }, []);

    // Force refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refreshTodayPrayers();
        }, [])
    );

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
            flex: 1
        };
    });

    const handlePress = (id: string, status: string) => {
        markAsPrayed(id);
    };

    const date = new Date();
    const dateString = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const dailyQuote = getDailyQuote();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const handleLogout = async () => {
        await resetData();
        await supabase.auth.signOut();
    };

    return (
        <SafeAreaView style={styles.container}>
            <AchievementPopup />
            <Animated.View style={animatedStyle}>
                <View style={styles.header}>
                    <View style={[styles.greetingRow, { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }]}>
                        <View>
                            {profileStatus === 'loading' ? (
                                <View style={styles.skeletonText} />
                            ) : profileStatus === 'error' ? (
                                <Text style={[styles.greetingText, { color: Colors.error, fontSize: 16 }]} onPress={refreshProfile}>
                                    Error loading profile. Tap to retry.
                                </Text>
                            ) : (
                                <Text style={styles.greetingText}>Assalam-o-Alaikum, {profile?.username || 'Friend'}!</Text>
                            )}
                        </View>
                        <Ionicons name="log-out-outline" size={24} color={Colors.textLight} onPress={handleLogout} />
                    </View>
                    <Text style={styles.dateText}>{dateString}</Text>

                    <View style={styles.quoteContainer}>
                        <Text style={styles.quoteText}>"{dailyQuote}"</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Main Streak Card */}
                    <View style={styles.streakCard}>
                        <View>
                            <Text style={styles.streakLabel}>Current Streak</Text>
                            <Text style={styles.streakValue}>{streak} <Text style={styles.daysText}>Days</Text></Text>
                        </View>
                        <Ionicons name="flame" size={56} color="#F6AD55" />
                    </View>

                    {/* Progress Card */}
                    <View style={styles.progressCard}>
                        <View>
                            <Text style={styles.progressTitle}>Today's Progress</Text>
                            <Text style={styles.progressSubtitle}>{completed}/{total} Completed</Text>
                        </View>
                        <CircularProgress
                            progress={completed / total}
                            size={60}
                            strokeWidth={6}
                            color={Colors.primary}
                            backgroundColor={Colors.border}
                        />
                    </View>

                    {/* Prayer List */}
                    <View style={styles.listContainer}>
                        {prayers.map((prayer, index) => {
                            // const isFuture = prayer.startTime ? !hasTimePassed(prayer.startTime) : false;

                            return (
                                <AnimatedPrayerCard
                                    key={prayer.id}
                                    id={prayer.id}
                                    name={prayer.name}
                                    status={prayer.status}
                                    displayTime={prayer.mosqueTime || prayer.startTime}
                                    displayLabel={prayer.mosqueTime ? "Jamaat" : "Starts"}
                                    index={index}
                                    onPress={() => handlePress(prayer.id, prayer.status)}
                                />
                            );
                        })}
                    </View>
                </ScrollView>
            </Animated.View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    greetingRow: {
        marginBottom: 4,
    },
    greetingText: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    skeletonText: {
        width: 200,
        height: 28,
        backgroundColor: Colors.border,
        borderRadius: 4,
        opacity: 0.5,
    },
    dateText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    quoteContainer: {
        marginTop: 4,
        paddingLeft: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#ECC94B', // Gold
    },
    quoteText: {
        fontStyle: 'italic',
        color: Colors.primaryDark,
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    streakCard: {
        backgroundColor: '#319795', // Teal Green
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        shadowColor: '#319795',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    streakLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    streakValue: {
        color: '#FFFFFF',
        fontSize: 42,
        fontWeight: '800',
    },
    daysText: {
        fontSize: 20,
        fontWeight: '600',
    },
    progressCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 6,
    },
    progressSubtitle: {
        fontSize: 15,
        color: Colors.textLight,
        fontWeight: '500',
    },
    listContainer: {
        gap: 4,
    },
});
