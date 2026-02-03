import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ViewStyle, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface PrayerCardProps {
    id: string;
    name: string;
    status: 'Pending' | 'Prayed' | 'Missed' | 'Late';
    index: number;
    onPress: () => void;
    disabled?: boolean;
    displayTime?: string;
    displayLabel?: string;
}

const PrayerIcon = ({ name }: { name: string }) => {
    let iconName: keyof typeof Feather.glyphMap = 'sun';
    let color = '#F6E05E';

    if (name === 'Fajr') { iconName = 'sunrise'; color = '#F6AD55'; }
    else if (name === 'Dhuhr') { iconName = 'sun'; color = '#F6E05E'; }
    else if (name === 'Asr') { iconName = 'cloud'; color = '#CBD5E0'; } // Afternoon cloud?
    else if (name === 'Maghrib') { iconName = 'sunset'; color = '#F6AD55'; }
    else if (name === 'Isha') { iconName = 'moon'; color = '#4A5568'; }

    return (
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Feather name={iconName} size={20} color={color === '#CBD5E0' ? '#718096' : color} />
        </View>
    );
};



export default function AnimatedPrayerCard({ id, name, status, index, onPress, disabled, displayTime, displayLabel }: PrayerCardProps) {
    const translateX = useSharedValue(-50);
    const opacity = useSharedValue(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        translateX.value = withDelay(index * 100, withSpring(0));
        opacity.value = withDelay(index * 100, withSpring(1));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
            opacity: opacity.value,
        };
    });

    const isPrayed = status === 'Prayed' || status === 'Late';
    const isLate = status === 'Late';

    const handlePress = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await onPress();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Animated.View style={[styles.card, animatedStyle, disabled && { opacity: 0.6 }]}>
            <TouchableOpacity
                style={styles.touchable}
                onPress={handlePress}
                activeOpacity={0.8}
                disabled={disabled || isLoading}
            >
                <View style={styles.leftContent}>
                    <PrayerIcon name={name} />
                    <View>
                        <Text style={[styles.name, isPrayed && styles.nameCompleted]}>{name}</Text>
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeLabel}>{displayLabel || ''}</Text>
                            <Text style={styles.timeValue}>{displayTime || ''}</Text>
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
                    isPrayed ? styles.checkboxChecked : styles.checkboxUnchecked,
                    isLate && styles.checkboxLate
                ]}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={isPrayed ? '#FFF' : Colors.primary} />
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
        backgroundColor: Colors.surface,
        marginBottom: 12,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
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
        color: Colors.text,
    },
    nameCompleted: {
        color: Colors.primary, // Teal
        fontWeight: 'bold',
        // textDecorationLine: 'line-through', // REMOVED
    },
    timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    timeLabel: { fontSize: 11, color: Colors.textLight },
    timeValue: { fontSize: 11, fontWeight: '700', color: Colors.text },
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
        borderColor: Colors.border,
    },
    checkboxChecked: {
        backgroundColor: Colors.primary, // Teal
        borderColor: Colors.primary,
    },
    checkboxLate: {
        backgroundColor: '#FC8181', // Red for late checkmark bg
        borderColor: '#FC8181',
    },
});
