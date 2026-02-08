import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Modal } from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import UniversalTimePicker from '../../components/UniversalTimePicker';
import { PRAYER_TIMES } from '../../constants/PrayerTimes';

// Default times in case context isn't loaded or relevant yet (since we are setting up FRESH profile)
// We use the same defaults as Context
const DEFAULT_TIMES = [
    { id: '1', startTime: '05:00', endTime: '06:30' },
    { id: '2', startTime: '12:30', endTime: '15:45' },
    { id: '3', startTime: '15:45', endTime: '18:15' },
    { id: '4', startTime: '18:15', endTime: '19:40' },
    { id: '5', startTime: '19:40', endTime: '23:59' },
];

export default function UsernameScreen() {
    const { user, refreshProfile } = useAuth();
    const [step, setStep] = useState(0); // 0: Username, 1: Times
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [prayerTimes, setPrayerTimes] = useState(DEFAULT_TIMES);

    // Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerValue, setPickerValue] = useState(new Date());
    const [webTimeInput, setWebTimeInput] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingType, setEditingType] = useState<'start' | 'end'>('start');

    const handleNext = () => {
        if (username.length < 3) {
            Alert.alert('Error', 'Username must be at least 3 characters long.');
            return;
        }
        setStep(1);
    };

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

        // Validation against opposite time
        const prayer = prayerTimes.find(p => p.id === editingId);
        if (prayer) {
            const startLimit = editingType === 'end' ? prayer.startTime : newTime;
            const endLimit = editingType === 'start' ? prayer.endTime : newTime;

            const [sH, sM] = startLimit.split(':').map(Number);
            const [eH, eM] = endLimit.split(':').map(Number);
            if (sH * 60 + sM >= eH * 60 + eM) {
                Alert.alert("Invalid Time", "End time must be later than start time.");
                return; // Do not update
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
        console.log("Starting handleFinish...");
        try {
            // Save Username and Settings
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: username,
                    prayer_settings: {
                        notificationsEnabled: false,
                        reminderLeadTime: 15,
                        prayerTimes: prayerTimes
                    },
                    updated_at: new Date()
                });

            if (profileError) throw profileError;
            console.log("Profile saved successfully.");

            if (Platform.OS === 'web') {
                // Web: Reload immediately to force fresh state
                console.log("Reloading window for Web...");
                window.location.reload();
                return;
            }

            // Mobile: Standard refresh
            await refreshProfile();
        } catch (error: any) {
            console.error("Error in handleFinish:", error);
            if (Platform.OS === 'web') {
                window.alert('Error saving profile: ' + error.message);
            } else {
                Alert.alert('Error', error.message);
            }
        } finally {
            if (Platform.OS !== 'web') {
                setLoading(false);
            }
            // On Web, we leave loading true until reload happens to prevent UI flicker
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={step === 0 ? "person" : "time"} size={48} color={Colors.surface} />
                    </View>
                    <Text style={styles.title}>{step === 0 ? "Welcome!" : "Setup Times"}</Text>
                    <Text style={styles.subtitle}>{step === 0 ? "What should we call you?" : "Confirm your prayer schedule"}</Text>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {step === 0 ? (
                        <View style={styles.stepContainer}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="at" size={20} color={Colors.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Username"
                                    placeholderTextColor={Colors.textLight}
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={handleNext}>
                                <Text style={styles.buttonText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView style={styles.timesList} showsVerticalScrollIndicator={false}>
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
                            <TouchableOpacity style={[styles.button, styles.finishButton]} onPress={handleFinish} disabled={loading}>
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Get Started</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    )}
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

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    keyboardView: { flex: 1 },
    header: {
        flex: 0.35,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    iconContainer: {
        width: 80, height: 80,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
    content: { flex: 0.65, padding: 24 },
    stepContainer: { paddingTop: 40 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        borderWidth: 1, borderColor: Colors.border,
        marginBottom: 24,
        shadowColor: Colors.primary, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: Colors.text, fontSize: 18 },
    button: {
        backgroundColor: Colors.primary,
        height: 56, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
    },
    finishButton: { marginTop: 32, marginBottom: 40 },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    // Times List Styles
    timesList: { flex: 1, marginTop: 10 },
    timeRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: 16, borderRadius: 12, marginBottom: 12,
        borderWidth: 1, borderColor: Colors.border
    },
    prayerName: { fontSize: 16, fontWeight: '600', color: Colors.text, width: 80 },
    timesContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timePill: {
        backgroundColor: Colors.background,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 8, borderWidth: 1, borderColor: Colors.border
    },
    timeText: { fontSize: 14, fontWeight: '600', color: Colors.primaryDark },
    toText: { color: Colors.textLight, fontSize: 12 },

    // Modal
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    pickerCard: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    pickerTitle: { fontWeight: '600', fontSize: 16 },
    cancelText: { color: Colors.textLight, fontSize: 16 },
    doneText: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
});
