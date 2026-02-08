import React, { useMemo } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { usePrayers } from '../context/PrayerContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Helper to get last 7 dates
const getLast7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates.reverse();
};

export default function ProgressScreen() {
    const { streak, longestStreak, getToDaysRatio, data } = usePrayers();
    const { completed, total } = getToDaysRatio();
    const { colors, isDark } = useTheme();

    // 1. Process Calendar Markers
    const markedDates = useMemo(() => {
        const markers: any = {};

        Object.keys(data).forEach(date => {
            const dayStatus = data[date];
            const prayedCount = Object.values(dayStatus).filter(s => s === 'Prayed' || s === 'Late').length;

            // Logic: Teal (5), Yellow (1-4), Gray (0/Missed)
            let color = '#CBD5E0'; // Gray
            if (prayedCount === 5) color = '#319795'; // Teal
            else if (prayedCount > 0) color = '#ECC94B'; // Yellow

            markers[date] = {
                customStyles: {
                    container: { backgroundColor: 'transparent' },
                    text: { color: colors.text },
                },
                dotColor: color,
                marked: true
            };
        });

        const today = new Date().toISOString().split('T')[0];
        if (!markers[today]) {
            markers[today] = { selected: true, selectedColor: colors.primary };
        } else {
            markers[today].selected = true;
            markers[today].selectedColor = colors.primary;
        }

        return markers;
    }, [data, colors]);

    // 2. Process Breakdown (Last 7 Days)
    const breakdown = useMemo(() => {
        const last7 = getLast7Days();
        // Structure: { '1': count, '2': count ... }
        const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        last7.forEach(date => {
            const dayData = data[date] || {};
            Object.keys(counts).forEach(pid => {
                if (dayData[pid] === 'Prayed' || dayData[pid] === 'Late') {
                    counts[pid]++;
                }
            });
        });

        return prayerNames.map((name, idx) => ({
            name,
            count: counts[String(idx + 1)],
            total: 7
        }));
    }, [data]);

    // Dynamic Styles
    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        header: { backgroundColor: colors.surface, borderBottomColor: colors.border },
        titleText: { color: colors.text },
        card: { backgroundColor: colors.surface, shadowOpacity: isDark ? 0 : 0.05 },
        cardTitle: { color: colors.text },
        streakLabel: { color: colors.textLight },
        streakCount: { color: colors.text },
        legendText: { color: colors.textLight },
        breakdownName: { color: colors.text },
        barTrack: { backgroundColor: isDark ? colors.background : colors.background }, // Maybe darker background for track in dark mode?
        breakdownCount: { color: colors.textLight }
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <View style={[styles.header, dynamicStyles.header]}>
                <Text style={[styles.titleText, dynamicStyles.titleText]}>Your Progress</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Streak Highlights */}
                <View style={styles.streakRow}>
                    <View style={[styles.card, styles.streakCard, dynamicStyles.card]}>
                        <Ionicons name="flame" size={28} color={Colors.accent} />
                        <View>
                            <Text style={[styles.streakLabel, dynamicStyles.streakLabel]}>Current</Text>
                            <Text style={[styles.streakCount, dynamicStyles.streakCount]}>{streak} Days</Text>
                        </View>
                    </View>
                    <View style={[styles.card, styles.streakCard, dynamicStyles.card]}>
                        <Ionicons name="trophy" size={28} color={colors.primary} />
                        <View>
                            <Text style={[styles.streakLabel, dynamicStyles.streakLabel]}>Best</Text>
                            <Text style={[styles.streakCount, dynamicStyles.streakCount]}>{longestStreak} Days</Text>
                        </View>
                    </View>
                </View>

                {/* Calendar */}
                <View style={[styles.card, dynamicStyles.card]}>
                    <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Monthly Overview</Text>
                    <Calendar
                        markingType={'simple'}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: 'transparent',
                            calendarBackground: 'transparent',
                            textSectionTitleColor: colors.textLight,
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: colors.primary,
                            dayTextColor: colors.text,
                            textDisabledColor: '#d9e1e8',
                            dotColor: '#00adf5',
                            selectedDotColor: '#ffffff',
                            arrowColor: colors.primary,
                            monthTextColor: colors.text,
                            indicatorColor: 'blue',
                            textDayFontWeight: '400',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '400',
                            textDayFontSize: 14,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 12
                        }}
                    />
                    <View style={[styles.legend, { borderTopColor: colors.border }]}>
                        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#319795' }]} /><Text style={[styles.legendText, dynamicStyles.legendText]}>Complete</Text></View>
                        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#ECC94B' }]} /><Text style={[styles.legendText, dynamicStyles.legendText]}>Partial</Text></View>
                        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#CBD5E0' }]} /><Text style={[styles.legendText, dynamicStyles.legendText]}>Missed</Text></View>
                    </View>
                </View>

                {/* Breakdown */}
                <View style={[styles.card, dynamicStyles.card]}>
                    <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Prayer Breakdown (7 Days)</Text>
                    <View style={styles.breakdownList}>
                        {breakdown.map((item, index) => (
                            <View key={index} style={styles.breakdownItem}>
                                <Text style={[styles.breakdownName, dynamicStyles.breakdownName]}>{item.name}</Text>
                                <View style={[styles.barTrack, dynamicStyles.barTrack]}>
                                    <View style={[styles.barFill, { width: `${(item.count / 7) * 100}%`, backgroundColor: colors.primary }]} />
                                </View>
                                <Text style={[styles.breakdownCount, dynamicStyles.breakdownCount]}>{item.count}/7</Text>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 40,
        borderBottomWidth: 1,
    },
    titleText: {
        fontSize: 28,
        fontWeight: '600',
    },
    content: {
        padding: 20,
        gap: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    streakRow: {
        flexDirection: 'row',
        gap: 12,
    },
    streakCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    streakLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
    },
    streakCount: {
        fontSize: 20,
        fontWeight: '700',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
    },
    breakdownList: {
        gap: 12,
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    breakdownName: {
        width: 60,
        fontSize: 14,
        fontWeight: '600',
    },
    barTrack: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    breakdownCount: {
        fontSize: 12,
        width: 30,
        textAlign: 'right',
    },
});
