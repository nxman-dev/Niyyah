import React, { useMemo } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { usePrayers } from '../context/PrayerContext';
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
                    text: { color: Colors.text },
                },
                dotColor: color,
                marked: true
            };
        });

        const today = new Date().toISOString().split('T')[0];
        if (!markers[today]) {
            markers[today] = { selected: true, selectedColor: Colors.primary };
        } else {
            markers[today].selected = true;
            markers[today].selectedColor = Colors.primary;
        }

        return markers;
    }, [data]);

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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.titleText}>Your Progress</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Streak Highlights */}
                <View style={styles.streakRow}>
                    <View style={[styles.card, styles.streakCard]}>
                        <Ionicons name="flame" size={28} color={Colors.accent} />
                        <View>
                            <Text style={styles.streakLabel}>Current</Text>
                            <Text style={styles.streakCount}>{streak} Days</Text>
                        </View>
                    </View>
                    <View style={[styles.card, styles.streakCard]}>
                        <Ionicons name="trophy" size={28} color={Colors.primary} />
                        <View>
                            <Text style={styles.streakLabel}>Best</Text>
                            <Text style={styles.streakCount}>{longestStreak} Days</Text>
                        </View>
                    </View>
                </View>

                {/* Calendar */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Monthly Overview</Text>
                    <Calendar
                        markingType={'simple'}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: '#ffffff',
                            calendarBackground: '#ffffff',
                            textSectionTitleColor: '#b6c1cd',
                            selectedDayBackgroundColor: Colors.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: Colors.primary,
                            dayTextColor: '#2d4150',
                            textDisabledColor: '#d9e1e8',
                            dotColor: '#00adf5',
                            selectedDotColor: '#ffffff',
                            arrowColor: Colors.primary,
                            monthTextColor: Colors.text,
                            indicatorColor: 'blue',
                            textDayFontWeight: '400',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '400',
                            textDayFontSize: 14,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 12
                        }}
                    />
                    <View style={styles.legend}>
                        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#319795' }]} /><Text style={styles.legendText}>Complete</Text></View>
                        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#ECC94B' }]} /><Text style={styles.legendText}>Partial</Text></View>
                        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#CBD5E0' }]} /><Text style={styles.legendText}>Missed</Text></View>
                    </View>
                </View>

                {/* Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Prayer Breakdown (7 Days)</Text>
                    <View style={styles.breakdownList}>
                        {breakdown.map((item, index) => (
                            <View key={index} style={styles.breakdownItem}>
                                <Text style={styles.breakdownName}>{item.name}</Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${(item.count / 7) * 100}%` }]} />
                                </View>
                                <Text style={styles.breakdownCount}>{item.count}/7</Text>
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
        backgroundColor: Colors.background,
    },
    header: {
        padding: 24,
        paddingTop: 40,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    titleText: {
        fontSize: 28,
        fontWeight: '600',
        color: Colors.text,
    },
    content: {
        padding: 20,
        gap: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        color: Colors.text,
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
        color: Colors.textLight,
        textTransform: 'uppercase',
    },
    streakCount: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
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
        color: Colors.textLight,
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
        color: Colors.text,
    },
    barTrack: {
        flex: 1,
        height: 8,
        backgroundColor: Colors.background,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    breakdownCount: {
        fontSize: 12,
        color: Colors.textLight,
        width: 30,
        textAlign: 'right',
    },
});
