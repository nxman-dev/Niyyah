import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import OnboardingProgressBar from '../../components/OnboardingProgressBar';
import UniversalTimePicker from '../../components/UniversalTimePicker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_TIMES = [
    { id: '1', startTime: '05:00', endTime: '06:30' },
    { id: '2', startTime: '12:30', endTime: '15:45' },
    { id: '3', startTime: '15:45', endTime: '18:15' },
    { id: '4', startTime: '18:15', endTime: '19:40' },
    { id: '5', startTime: '19:40', endTime: '23:59' },
];

export default function InitialTimesScreen({ route, navigation }: any) {
    const { username } = route.params;
    const { user, refreshProfile } = useAuth();
    const [prayerTimes, setPrayerTimes] = useState(DEFAULT_TIMES);
    const [loading, setLoading] = useState(false);

    // Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerValue, setPickerValue] = useState(new Date());
    const [webTimeInput, setWebTimeInput] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingType, setEditingType] = useState<'start' | 'end'>('start');

    const handleTimePress = (id: string, type: 'start' | 'end', timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        setPickerValue(date);
        setWebTimeInput(timeStr);
        setEditingId(id);
        setEditingType(type);
        setShowPicker(true);
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setPickerValue(selectedDate);
            if (Platform.OS === 'android') {
                applyTimeUpdate(selectedDate);
                setShowPicker(false);
            }
        }
    };

    const applyTimeUpdate = (date: Date) => {
        if (!editingId) return;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const newTime = `${hours}:${minutes}`;

        // Validation
        const prayer = prayerTimes.find(p => p.id === editingId);
        if (prayer) {
            const startLimit = editingType === 'end' ? prayer.startTime : newTime;
            const endLimit = editingType === 'start' ? prayer.endTime : newTime;
            const [sH, sM] = startLimit.split(':').map(Number);
            const [eH, eM] = endLimit.split(':').map(Number);
            if (sH * 60 + sM >= eH * 60 + eM) {
                Alert.alert("Invalid Time", "End time must be later than start time.");
                return;
            }
        }

        setPrayerTimes(prev => prev.map(pt =>
            pt.id === editingId ? { ...pt, [editingType === 'start' ? 'startTime' : 'endTime']: newTime } : pt
        ));

        if (Platform.OS !== 'ios' && Platform.OS !== 'web') setEditingId(null);
    };

    async function handleFinish() {
        if (!user) return;
        setLoading(true);
        console.log("Saving Profile...", { username, prayerTimes });
        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: username,
                    prayer_settings: { // Using correct column name
                        notificationsEnabled: false,
                        reminderLeadTime: 15,
                        prayerTimes: prayerTimes
                    },
                    updated_at: new Date()
                });

            if (profileError) throw profileError;

            console.log("Profile Saved.");

            if (Platform.OS === 'web') {
                window.location.reload();
                return;
            }

            await refreshProfile();
        } catch (error: any) {
            console.error(error);
            const msg = error.message || "Failed to save.";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Error', msg);
        } finally {
            if (Platform.OS !== 'web') setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgressBar progress={1.0} />

            <View style={styles.header}>
                <Text style={styles.title}>Confirm Prayer Times</Text>
                <Text style={styles.subtitle}>We've set these defaults for you. Adjust if needed!</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {prayerTimes.map((pt, index) => {
                    const name = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'][index];
                    return (
                        <View key={pt.id} style={styles.timeRow}>
                            <Text style={styles.prayerName}>{name}</Text>
                            <View style={styles.timesContainer}>
                                <TouchableOpacity style={styles.timePill} onPress={() => handleTimePress(pt.id, 'start', pt.startTime)}>
                                    <Text style={styles.timeText}>{pt.startTime}</Text>
                                </TouchableOpacity>
                                <Text style={styles.toText}>to</Text>
                                <TouchableOpacity style={styles.timePill} onPress={() => handleTimePress(pt.id, 'end', pt.endTime)}>
                                    <Text style={styles.timeText}>{pt.endTime}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleFinish} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>LOOKS GOOD!</Text>}
                </TouchableOpacity>
            </View>

            {/* Universal Time Picker */}
            <UniversalTimePicker
                show={showPicker}
                value={pickerValue}
                onClose={() => setShowPicker(false)}
                onChange={onTimeChange}
                onConfirm={() => {
                    applyTimeUpdate(pickerValue);
                    setShowPicker(false);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: 24, marginTop: 10, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 16, color: Colors.textLight, textAlign: 'center' },
    content: { flex: 1, paddingHorizontal: 24 },
    footer: { padding: 24 },

    timeRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: 16, borderRadius: 16, marginBottom: 12,
        borderWidth: 2, borderColor: Colors.border,
        shadowColor: Colors.primary, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    prayerName: { fontSize: 16, fontWeight: '700', color: Colors.text, width: 80 },
    timesContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timePill: {
        backgroundColor: Colors.background,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 8, borderWidth: 1, borderColor: Colors.border
    },
    timeText: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
    toText: { color: Colors.textLight, fontSize: 12, fontWeight: '600' },

    button: {
        width: '100%',
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        borderBottomWidth: 4,
        borderBottomColor: '#2C7A7B',
    },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 1 },

    // Modal
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    pickerCard: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    pickerTitle: { fontWeight: '600', fontSize: 16 },
    cancelText: { color: Colors.textLight, fontSize: 16 },
    doneText: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
});
