import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface PrayerCardProps {
    id: string;
    name: string;
    status: 'Pending' | 'Prayed' | 'Missed' | 'Late';
    index: number;
    onPress: () => void;
    disabled?: boolean;
    displayTime?: string;
    displayLabel?: string;
    isNext?: boolean;
}

const PrayerIcon = ({ name, isDark }: { name: string, isDark: boolean }) => {
    let iconName: keyof typeof Feather.glyphMap = 'sun';
    let color = '#F6E05E';

    if (name === 'Fajr') { iconName = 'sunrise'; color = '#F6AD55'; }
    else if (name === 'Dhuhr') { iconName = 'sun'; color = '#F6E05E'; }
    else if (name === 'Asr') { iconName = 'cloud'; color = '#CBD5E0'; }
    else if (name === 'Maghrib') { iconName = 'sunset'; color = '#F6AD55'; }
    else if (name === 'Isha') { iconName = 'moon'; color = '#4A5568'; }

    // Adjust icon colors for dark mode visibility if needed
    if (isDark && name === 'Isha') { color = '#A0AEC0'; }

    return (
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Feather name={iconName} size={20} color={color === '#CBD5E0' ? '#718096' : color} />
        </View>
    );
};

export default function AnimatedPrayerCard({ id, name, status, index, onPress, disabled, displayTime, displayLabel }: PrayerCardProps) {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const [isLoading, setIsLoading] = useState(false);
    const { colors, isDark } = useTheme();

    const isPrayed = status === 'Prayed' || status === 'Late';
    const isLate = status === 'Late';

    const handlePress = async () => {
        if (isLoading) return;
        setIsLoading(true);

        // Pop Animation
        Animated.sequence([
            Animated.timing(scaleValue, {
                toValue: 0.95,
                duration: 150, // Slower, smoother shrink
                useNativeDriver: true,
                // easing: Easing.out(Easing.quad), // We need to import Easing if we use it, but default is often fine. Let's stick to simple timing first or add import.
            }),
            Animated.spring(scaleValue, {
                toValue: 1,
                friction: 4, // Lower friction for a bit more "life" but controlled
                tension: 20, // Lower tension = slower, smoother bounce back
                useNativeDriver: true,
            })
        ]).start();

        try {
            await onPress();
        } finally {
            setIsLoading(false);
        }
    };

    // Dynamic Styles for items
    const dynamicStyles = {
        card: {
            backgroundColor: colors.surface,
            shadowOpacity: isDark ? 0 : 0.1,
            shadowColor: colors.primary
        },
        name: { color: colors.text },
        nameCompleted: { color: colors.primary },
        timeLabel: { color: colors.textLight },
        timeValue: { color: colors.text },
        checkboxUnchecked: { borderColor: colors.border },
        checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    };

    return (
        <Animated.View style={[
            styles.card,
            dynamicStyles.card,
            disabled && { opacity: 0.6 },
            { transform: [{ scale: scaleValue }] }
        ]}>
            <TouchableOpacity
                style={styles.touchable}
                onPress={handlePress}
                activeOpacity={0.8}
                disabled={disabled || isLoading}
            >
                <View style={styles.leftContent}>
                    <PrayerIcon name={name} isDark={isDark} />
                    <View>
                        <Text style={[styles.name, dynamicStyles.name, isPrayed && dynamicStyles.nameCompleted]}>{name}</Text>
                        <View style={styles.timeContainer}>
                            <Text style={[styles.timeLabel, dynamicStyles.timeLabel]}>{displayLabel || ''}</Text>
                            <Text style={[styles.timeValue, dynamicStyles.timeValue]}>{displayTime || ''}</Text>
                        </View>
                        {isLate && (
                            <View style={styles.lateBadge}>
                                <Text style={styles.lateText}>Late</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={[
                    styles.checkboxRing,
                    isPrayed ? [styles.checkboxChecked, dynamicStyles.checkboxChecked] : [styles.checkboxUnchecked, dynamicStyles.checkboxUnchecked],
                    isLate && styles.checkboxLate
                ]}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={isPrayed ? '#FFF' : colors.primary} />
                    ) : (
                        isPrayed && <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 3,
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
    },
    nameCompleted: {
        fontWeight: 'bold',
    },
    timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    timeLabel: { fontSize: 11 },
    timeValue: { fontSize: 11, fontWeight: '700' },
    lateBadge: {
        backgroundColor: '#FC8181', // Reddish
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
        alignSelf: 'flex-start',
    },
    lateText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    checkboxRing: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxUnchecked: {
        // Dynamic
    },
    checkboxChecked: {
        // Dynamic
    },
    checkboxLate: {
        backgroundColor: '#FC8181', // Red for late checkmark bg
        borderColor: '#FC8181',
    },
});
