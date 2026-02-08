import React, { useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView, Platform, Animated, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useTheme } from '../context/ThemeContext';
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
    const { colors, isDark } = useTheme();
    const animationRef = useRef<LottieView>(null);




    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    // Force refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refreshTodayPrayers();
        }, [])
    );

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

    const nextPrayerId = prayers.find(p => p.status === 'Pending')?.id;

    // Dynamic Styles
    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        loadingContainer: { backgroundColor: colors.background },
        greetingText: { color: colors.text, fontFamily: 'Inter_700Bold' },
        dateText: { color: colors.textLight, fontFamily: 'Inter_500Medium' },
        quoteText: { color: isDark ? colors.text : colors.primaryDark, fontFamily: 'Inter_400Regular' },
        progressCard: { backgroundColor: colors.surface, shadowOpacity: isDark ? 0 : 0.05 },
        progressTitle: { color: colors.text, fontFamily: 'Inter_600SemiBold' },
        progressSubtitle: { color: colors.textLight, fontFamily: 'Inter_400Regular' }
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, dynamicStyles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const handleLogout = async () => {
        await resetData();
        await supabase.auth.signOut();
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <AchievementPopup />
            <View style={{ flex: 1 }}>

                <View style={styles.header}>
                    <View style={[styles.greetingRow, { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }]}>
                        <View>
                            {profileStatus === 'loading' ? (
                                <View style={[styles.skeletonText, { backgroundColor: colors.border }]} />
                            ) : profileStatus === 'error' ? (
                                <Text style={[styles.greetingText, dynamicStyles.greetingText, { color: colors.error, fontSize: 16 }]} onPress={refreshProfile}>
                                    Error loading profile. Tap to retry.
                                </Text>
                            ) : (
                                <Text style={[styles.greetingText, dynamicStyles.greetingText]}>Assalam-o-Alaikum, {profile?.full_name || profile?.username || 'Friend'}!</Text>
                            )}
                        </View>
                        <Ionicons name="log-out-outline" size={24} color={colors.textLight} onPress={handleLogout} />
                    </View>
                    <Text style={[styles.dateText, dynamicStyles.dateText]}>{dateString}</Text>

                    <View style={styles.quoteContainer}>
                        <Text style={[styles.quoteText, dynamicStyles.quoteText]}>"{dailyQuote}"</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Main Streak Card - Now with Gradient & Lottie */}
                    <LinearGradient
                        colors={['#319795', '#2C7A7B']} // Gradient: Teal -> Darker Teal
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.streakCard}
                    >
                        <View>
                            <Text style={styles.streakLabel}>Current Streak</Text>
                            <Text style={styles.streakValue}>{streak} <Text style={styles.daysText}>Days</Text></Text>
                        </View>
                        <View style={{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}>
                            <Image
                                source={{ uri: 'https://i.gifer.com/origin/d4/d43c2j0e2.gif' }}
                                style={{ width: 60, height: 80 }}
                                resizeMode="contain"
                            />
                        </View>
                    </LinearGradient>

                    {/* Progress Card */}
                    <View style={[styles.progressCard, dynamicStyles.progressCard]}>
                        <View>
                            <Text style={[styles.progressTitle, dynamicStyles.progressTitle]}>Today's Progress</Text>
                            <Text style={[styles.progressSubtitle, dynamicStyles.progressSubtitle]}>{completed}/{total} Completed</Text>
                        </View>
                        <CircularProgress
                            progress={completed / total}
                            size={60}
                            strokeWidth={6}
                            color={colors.primary}
                            backgroundColor={colors.border}
                        />
                    </View>

                    {/* Prayer List - Staggered Entrance */}
                    <View style={styles.listContainer}>
                        {prayers.map((prayer, index) => {
                            return (
                                <View
                                    key={prayer.id}
                                // entering={FadeInDown.delay(index * 100).springify()}
                                // layout={Layout.springify()}
                                >
                                    <AnimatedPrayerCard
                                        id={prayer.id}
                                        name={prayer.name}
                                        status={prayer.status}
                                        displayTime={prayer.mosqueTime || prayer.startTime}
                                        displayLabel={prayer.mosqueTime ? "Jamaat" : "Starts"}
                                        index={index}
                                        onPress={() => handlePress(prayer.id, prayer.status)}
                                        isNext={prayer.id === nextPrayerId}
                                    />
                                </View>
                            );
                        })}
                    </View>

                </ScrollView>
            </View >

        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
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
        letterSpacing: -0.5,
    },
    skeletonText: {
        width: 200,
        height: 28,
        borderRadius: 4,
        opacity: 0.5,
    },
    dateText: {
        fontSize: 14,
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
        fontSize: 15,
        lineHeight: 22,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    streakCard: {
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
        fontFamily: 'Inter_500Medium',
        marginBottom: 8,
    },
    streakValue: {
        color: '#FFFFFF',
        fontSize: 42,
        fontFamily: 'Inter_700Bold',
    },
    daysText: {
        fontSize: 20,
        fontFamily: 'Inter_600SemiBold',
    },
    progressCard: {
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 3,
    },
    progressTitle: {
        fontSize: 18,
        marginBottom: 6,
    },
    progressSubtitle: {
        fontSize: 15,
    },
    listContainer: {
        gap: 4,
    },
});
