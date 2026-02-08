import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform, Modal, KeyboardAvoidingView, TextInput } from 'react-native';
import { Colors } from '../constants/Colors';
import { usePrayers, PrayerTimeConfig } from '../context/PrayerContext';
import { Ionicons } from '@expo/vector-icons';
import UniversalTimePicker from '../components/UniversalTimePicker';

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
        if (selectedDate) {
            setPickerValue(selectedDate);
            if (Platform.OS === 'android') {
                // For Android, standard behavior is often to close on selection
                // The wrapper might handle closing, but we need to ensure value is applied.
                // Our wrapper calls onChange then close. 
                // We just need to apply the update.
                applyTimeUpdate(selectedDate);
            }
            // For iOS/Web, the wrapper has a 'Done' button or similar that triggers the close/save?
            // Actually, looking at my UniversalTimePicker implementation:
            // iOS: Has "Done" button which just closes. Use onChange to update state?
            // Web: onChange updates state.

            // Wait, the UniversalTimePicker for iOS has a "Done" button in the header, but it just calls onClose.
            // It doesn't call an explicit verify.
            // But the standard DateTimePicker in iOS updates 'value' as you scroll.
            // So if we update local state here, we are good.
        }
    };

    // We need a way to APPLY the loaded pickerValue when the user clicks DONE in the UniversalPicker (iOS/Web).
    // The UniversalPicker for iOS wraps content in a Modal. It has a "Done" button that calls onClose.
    // But it doesn't automatically "apply" to the parent state (localTimes) unless we tell it to.

    // In the old code:
    // iOS: Done button called `applyTimeUpdate(pickerValue)`.
    // Web: Done button called `applyTimeUpdate(pickerValue)`.

    // My UniversalTimePicker 'Done' button just calls `onClose`.
    // So I should modify `handlePickerClose` or similar.

    // Let's adjust `UniversalTimePicker` usage or the parent logic.
    // Easier to pass a specific `onConfirm` prop? Or just handle it in `onClose`?
    // If I use `onClose`, I don't know if it was Cancelled or Confirmed.

    // Let's modify `onTimeChange` to just update the temporary `pickerValue`.
    // And add a `onConfirm` or similar to UniversalTimePicker? 
    // Or, just change `UniversalTimePicker` to have `onConfirm`.

    // Actually, looking at `UniversalTimePicker`:
    // iOS: "Done" calls `onClose`.
    // Web: "Done" calls `onClose`.

    // I should probably update `UniversalTimePicker` to accept `onConfirm`. 
    // OR, I can just update the value immediately for everyone and rely on "Cancel" to revert? 
    // But "Cancel" isn't implemented effectively in my UniversalPicker (iOS just has Done).

    // Let's stick to the pattern: 
    // `pickerValue` tracks the transient state.
    // When the picker closes (Done), we commit it.

    // But `onClose` is void.

    // Retrying: I will update `UniversalTimePicker` to support `onConfirm`?
    // Or simpler: In `PrayerTimesScreen`, I can wrap `onClose`.
    // Be careful.

    // Let's look at `UniversalTimePicker` again.
    // iOS: `Done` calls `onClose`. 
    // So if I pass `() => { applyTimeUpdate(pickerValue); setShowPicker(false); }` as `onClose`,
    // it will apply the value when Done is pressed.

    // But wait, Android `onChange` calls `onClose` too. 
    // In Android `onChange` (date set), we want to apply.
    // In Android `onChange` (dismiss), `date` is undefined.

    // Let's refine `onTimeChange` to just set `pickerValue`.
    // And use `onClose` to trigger application?

    // No, Android calls `onChange` with date when set.
    // iOS/Web call `onChange` repeatedly/on-blur.

    // Let's change the usage in `PrayerTimesScreen`:
    // onClose={() => { applyTimeUpdate(pickerValue); setShowPicker(false); }}

    // But for Android, `onChange` already calls `onClose`.
    // If `onChange` fires, we update `pickerValue`. Then `onClose` fires and we apply?
    // That seems okay.

    // Use this logic:
    // 1. `onTimeChange` -> updates `pickerValue`. (And for Android, maybe we need to apply immediately if we want standard behavior, but let's see)
    // 2. `onClose` -> `applyTimeUpdate(pickerValue)` + close.

    // Check my UniversalTimePicker Android implementation:
    // onChange={(e, d) => { onClose(); onChange(e, d); }}
    // So it calls `onClose` THEN `onChange`. That's a bit backward risk.
    // Usually `onChange` (selection) happens, then we want to close.

    // I'll stick to:
    // `onTimeChange` just sets `pickerValue`.
    // `onClose` applies it.

    // Wait, Android: if I dismiss (cancel), `d` is undefined. `pickerValue` remains old? 
    // If so, `onClose` applying old value is fine (no change).
    // If I pick new date, `onChange` fires. `pickerValue` updates?
    // But `onClose` runs FIRST in my implementation?
    // `onChange={(e, d) => { onClose(); onChange(e, d); }}`
    // If `onClose` runs first, `pickerValue` is still OLD.
    // So `applyTimeUpdate` uses OLD value.
    // Then `onChange` updates `pickerValue` to NEW value.
    // Result: Old value applied.

    // ISSUE: My `UniversalTimePicker` Android logic is slightly flawed for this usage.
    // I should fix `UniversalTimePicker` first? 
    // Or just fix it in Place? 

    // I will fix `UniversalTimePicker` locally in my mind or explicitly?
    // I already wrote it. I should fix it.


    const applyTimeUpdate = async (date: Date) => {
        if (!editingId) return;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const newTime = `${hours}:${minutes}`;

        // Create new list immediately
        const updatedTimes = localTimes.map(pt =>
            pt.id === editingId ? { ...pt, [editingField]: newTime } : pt
        );

        setLocalTimes(updatedTimes);
        setHasChanges(true);
        setEditingId(null);
        setShowPicker(false);

        // Immediate Save as requested
        console.log(`[PrayerTimesScreen] Saving updated time for ${editingId}: ${newTime}`);
        await updateSettings({ prayerTimes: updatedTimes });
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
    const TimeBox = ({ id, field, label, value }: { id: string, field: 'startTime' | 'mosqueTime' | 'endTime', label: string, value?: string }) => {
        const isActive = editingId === id && editingField === field; // If we wanted to highlight currently editing, but logic resets on close. 
        // Can't track 'active' easily without complex state matching. 
        // But we can just use value presence.

        return (
            <TouchableOpacity
                style={[
                    styles.timeBox,
                    !value && styles.timeBoxEmpty,
                    value && styles.timeBoxActive // Optional extra style for filled
                ]}
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
    };

    const names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Prayer Times</Text>
                    <Text style={styles.headerSubtitle}>Customize your schedule</Text>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={!hasChanges} style={[styles.saveButton, !hasChanges && styles.disabled]}>
                    <Text style={styles.saveText}>{hasChanges ? 'Save' : 'Saved'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.helperContainer}>
                    <Ionicons name="information-circle" size={20} color="#2C7A7B" />
                    <Text style={styles.helperText}>Hold a time chip to clear it. End time is always required.</Text>
                </View>

                {localTimes.map((pt, index) => (
                    <View key={pt.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.prayerName}>{names[index]}</Text>
                            <View style={styles.prayerIcon}>
                                <Ionicons name="time-outline" size={16} color={Colors.textLight} />
                            </View>
                        </View>
                        <View style={styles.inputs}>
                            <TimeBox id={pt.id} field="startTime" label="Start" value={pt.startTime} />
                            <TimeBox id={pt.id} field="mosqueTime" label="Mosque" value={pt.mosqueTime} />
                            <TimeBox id={pt.id} field="endTime" label="End" value={pt.endTime} />
                        </View>
                    </View>
                ))}
            </ScrollView>

            <UniversalTimePicker
                show={showPicker}
                value={pickerValue}
                onClose={() => setShowPicker(false)}
                onChange={onTimeChange}
                onConfirm={() => {
                    console.log("[PrayerTimesScreen] onConfirm received");
                    applyTimeUpdate(pickerValue);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' }, // Even cleaner white/gray
    header: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
        marginTop: 2,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    backButton: {
        padding: 8,
        backgroundColor: '#F0F2F5',
        borderRadius: 16,
    },
    disabled: { opacity: 0.6, shadowOpacity: 0 },

    content: { padding: 24, paddingBottom: 100 },

    helperContainer: {
        backgroundColor: '#E6FFFA', // Light Teal/Mint hint
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#B2F5EA',
    },
    helperText: {
        fontSize: 13,
        color: '#2C7A7B',
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },

    // Card Styles
    card: {
        marginBottom: 20,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3, // Android shadow
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    prayerName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    prayerIcon: {
        backgroundColor: '#F7FAFC',
        padding: 8,
        borderRadius: 12,
    },

    inputs: {
        flexDirection: 'row',
        gap: 12,
    },

    // Time Chip Styles
    timeBox: {
        flex: 1,
        backgroundColor: '#F7FAFC',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EDF2F7',
    },
    timeBoxActive: {
        backgroundColor: 'white',
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    timeBoxEmpty: {
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
    },
    timeLabel: {
        fontSize: 11,
        color: Colors.textLight,
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    timeValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        fontVariant: ['tabular-nums'],
    },
    timeValuePlaceholder: {
        color: '#CBD5E0',
        fontSize: 16,
    },

    // Unused but kept for safety if referenced in logic
    modalContainer: { flex: 1 },
    pickerCard: { flex: 1 },
    pickerHeader: { flex: 1 },
    pickerTitle: { flex: 1 },
    cancelText: { flex: 1 },
    doneText: { flex: 1 },
});
