import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform, Modal, KeyboardAvoidingView, TextInput } from 'react-native';
import { Colors } from '../constants/Colors';
import { usePrayers, PrayerTimeConfig } from '../context/PrayerContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PrayerTimesScreen({ navigation }: any) {
    const { settings, updateSettings } = usePrayers();
    // Local state for edits before save
    const [localTimes, setLocalTimes] = useState<PrayerTimeConfig[]>(JSON.parse(JSON.stringify(settings.prayerTimes)));
    const [hasChanges, setHasChanges] = useState(false);

    // Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerValue, setPickerValue] = useState(new Date());
    const [webTimeInput, setWebTimeInput] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<'startTime' | 'mosqueTime' | 'endTime'>('startTime');

    const handleSave = async () => {
        // Validation: Check each prayer has (Start OR Mosque) AND End AND End > Start
        for (const pt of localTimes) {
            if (!pt.startTime && !pt.mosqueTime) {
                Alert.alert("Error", "Each prayer must have at least a Start Time or Mosque Time.");
                return;
            }
            if (!pt.endTime) {
                Alert.alert("Error", "Each prayer must have an End Time.");
                return;
            }

            // Logic: Compare Start vs End. If Mosque exists, check Mosque vs End too?
            // Usually Mosque is shortly after Start. End is way later.
            // Let's just check End is after Start (if Start exists).
            if (pt.startTime && pt.endTime) {
                if (compareTimes(pt.startTime, pt.endTime) >= 0) {
                    Alert.alert("Error", `End time must be later than Start time for prayer ID ${pt.id}.`);
                    return;
                }
            }
        }

        await updateSettings({ prayerTimes: localTimes });
        navigation.goBack();
    };

    const compareTimes = (t1: string, t2: string) => {
        const [h1, m1] = t1.split(':').map(Number);
        const [h2, m2] = t2.split(':').map(Number);
        return (h1 * 60 + m1) - (h2 * 60 + m2);
    };

    const handleTimePress = (id: string, field: 'startTime' | 'mosqueTime' | 'endTime', currentValue?: string) => {
        const date = new Date();
        let initialWebTime = "12:00";
        if (currentValue) {
            const [h, m] = currentValue.split(':').map(Number);
            date.setHours(h, m, 0, 0);
            initialWebTime = currentValue;
        } else {
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            initialWebTime = `${h}:${m}`;
        }
        setPickerValue(date);
        setWebTimeInput(initialWebTime);
        setEditingId(id);
        setEditingField(field);
        setShowPicker(true);
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowPicker(false);
        if (selectedDate && editingId) {
            if (Platform.OS === 'ios' || Platform.OS === 'web') {
                setPickerValue(selectedDate);
            } else {
                applyTimeUpdate(selectedDate);
            }
        }
    };

    const applyTimeUpdate = (date: Date) => {
        if (!editingId) return;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const newTime = `${hours}:${minutes}`;

        setLocalTimes(prev => prev.map(pt =>
            pt.id === editingId ? { ...pt, [editingField]: newTime } : pt
        ));
        setHasChanges(true);
        setEditingId(null);
    };

    const clearTime = (id: string, field: 'startTime' | 'mosqueTime') => {
        setLocalTimes(prev => prev.map(pt =>
            pt.id === id ? { ...pt, [field]: undefined } : pt // Assuming backend handles undefined/null logic correctly? 
            // Ideally we might want to prevent clearing both.
        ));
        setHasChanges(true);
    };

    // For manual clearing in UI? Maybe hold to clear? Or separate X button. 
    // Implementing simple Tap to Edit. 

    // Helper to render a time box
    const TimeBox = ({ id, field, label, value }: { id: string, field: 'startTime' | 'mosqueTime' | 'endTime', label: string, value?: string }) => (
        <TouchableOpacity
            style={[styles.timeBox, !value && styles.timeBoxEmpty]}
            onPress={() => handleTimePress(id, field, value)}
            onLongPress={() => {
                if (field !== 'endTime') {
                    // Could offer clear
                    Alert.alert("Clear Time", `Clear ${label}?`, [
                        { text: "Cancel" },
                        { text: "Clear", onPress: () => clearTime(id, field as any) }
                    ]);
                }
            }}
        >
            <Text style={styles.timeLabel}>{label}</Text>
            <Text style={[styles.timeValue, !value && styles.timeValuePlaceholder]}>{value || '--:--'}</Text>
        </TouchableOpacity>
    );

    const names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Prayer Times</Text>
                <TouchableOpacity onPress={handleSave} disabled={!hasChanges} style={[styles.saveButton, !hasChanges && styles.disabled]}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.helperText}>Hold a time to clear it (Start/Mosque only). End time is required.</Text>
                {localTimes.map((pt, index) => (
                    <View key={pt.id} style={styles.row}>
                        <Text style={styles.prayerName}>{names[index]}</Text>
                        <View style={styles.inputs}>
                            <TimeBox id={pt.id} field="startTime" label="Start" value={pt.startTime} />
                            <TimeBox id={pt.id} field="mosqueTime" label="Mosque" value={pt.mosqueTime} />
                            <TimeBox id={pt.id} field="endTime" label="End" value={pt.endTime} />
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Picker Modal (iOS) or Component (Android) */}
            {Platform.OS === 'android' && showPicker && (
                <DateTimePicker value={pickerValue} mode="time" display="default" onChange={onTimeChange} />
            )}
            {(Platform.OS === 'ios' || Platform.OS === 'web') && (
                <Modal visible={showPicker} transparent animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.pickerCard}>
                            <View style={styles.pickerHeader}>
                                <TouchableOpacity onPress={() => setShowPicker(false)}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.pickerTitle}>Set Time</Text>
                                <TouchableOpacity onPress={() => { applyTimeUpdate(pickerValue); setShowPicker(false); }}>
                                    <Text style={styles.doneText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={pickerValue}
                                mode="time"
                                display={Platform.OS === 'web' ? 'default' : 'spinner'}
                                onChange={onTimeChange}
                                themeVariant="light"
                            />
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingTop: Platform.OS === 'android' ? 40 : 16 },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    saveButton: { padding: 8, backgroundColor: Colors.primary, borderRadius: 8 },
    saveText: { color: 'white', fontWeight: 'bold' },
    disabled: { opacity: 0.5 },
    content: { padding: 16 },
    helperText: { fontSize: 12, color: Colors.textLight, marginBottom: 16, textAlign: 'center' },
    row: { marginBottom: 20, backgroundColor: Colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
    prayerName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
    inputs: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    timeBox: { flex: 1, backgroundColor: Colors.background, padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    timeBoxEmpty: { borderColor: Colors.border, borderStyle: 'dashed' },
    timeLabel: { fontSize: 10, color: Colors.textLight, marginBottom: 4, textTransform: 'uppercase' },
    timeValue: { fontSize: 14, fontWeight: '600', color: Colors.primaryDark },
    timeValuePlaceholder: { color: Colors.textLight },

    // Modal
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    pickerCard: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    pickerTitle: { fontWeight: '600', fontSize: 16 },
    cancelText: { color: Colors.textLight, fontSize: 16 },
    doneText: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
});
