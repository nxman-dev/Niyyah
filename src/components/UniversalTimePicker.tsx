import React from 'react';
import { Platform, View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';

interface UniversalTimePickerProps {
    value: Date;
    onChange: (event: DateTimePickerEvent, date?: Date) => void;
    show: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    mode?: 'time' | 'date' | 'datetime';
}

/**
 * A wrapper around DateTimePicker that provides a fallback for Web using standard HTML input.
 */
export default function UniversalTimePicker({ value, onChange, show, onClose, onConfirm, mode = 'time' }: UniversalTimePickerProps) {
    const { colors, isDark } = useTheme();

    if (!show) return null;

    // Dynamic Styles
    const dynamicStyles = {
        webModalOverlay: { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' } as any,
        webCard: { backgroundColor: colors.surface, shadowColor: isDark ? '#000' : '#000' },
        webTitle: { color: colors.text },
        webInput: {
            backgroundColor: isDark ? colors.background : '#F7FAFC',
            color: colors.text,
            boxShadow: isDark ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.05)'
        },
        closeButton: { backgroundColor: colors.primary, shadowColor: colors.primary },

        iosModalOverlay: { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' },
        iosCard: { backgroundColor: colors.surface },
        iosButtonText: { color: colors.primary },
        pickerText: { color: colors.text } // For DateTimePicker if configurable via props/themeVariant
    };

    if (Platform.OS === 'web') {
        const timeString = value.toTimeString().slice(0, 5); // HH:MM

        const handleWebChange = (e: any) => {
            const newTime = e.target.value;
            if (newTime) {
                const [h, m] = newTime.split(':').map(Number);
                const date = new Date(value);
                date.setHours(h, m);
                onChange({ type: 'set', nativeEvent: {} as any }, date);
            }
        };

        return (
            <Modal transparent animationType="fade" visible={show} onRequestClose={onClose}>
                <View style={[styles.webModalOverlay, dynamicStyles.webModalOverlay]}>
                    <View style={[styles.webCard, dynamicStyles.webCard]}>
                        <Text style={[styles.webTitle, dynamicStyles.webTitle]}>Select Time</Text>
                        <input
                            type="time"
                            value={timeString}
                            onChange={handleWebChange}
                            style={{ ...styles.webInput, ...dynamicStyles.webInput } as any}
                        />
                        <View style={styles.webButtons}>
                            <TouchableOpacity onPress={() => {
                                console.log("[UniversalTimePicker] Web Done Clicked");
                                if (onConfirm) {
                                    console.log("[UniversalTimePicker] Calling onConfirm");
                                    onConfirm();
                                } else {
                                    console.log("[UniversalTimePicker] No onConfirm prop provided");
                                }
                                onClose();
                            }} style={[styles.closeButton, dynamicStyles.closeButton]}>
                                <Text style={styles.closeText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    if (Platform.OS === 'android') {
        return (
            <DateTimePicker
                value={value}
                mode={mode}
                display="default"
                onChange={(e, d) => {
                    onClose();
                    onChange(e, d);
                }}
            />
        );
    }

    // iOS
    return (
        <Modal transparent animationType="slide" visible={show} onRequestClose={onClose}>
            <View style={[styles.iosModalOverlay, dynamicStyles.iosModalOverlay]}>
                <View style={[styles.iosCard, dynamicStyles.iosCard]}>
                    <View style={styles.iosHeader}>
                        <TouchableOpacity onPress={() => {
                            console.log("[UniversalTimePicker] iOS Done Clicked");
                            if (onConfirm) {
                                console.log("[UniversalTimePicker] Calling onConfirm");
                                onConfirm();
                            }
                            onClose();
                        }}>
                            <Text style={[styles.iosButtonText, dynamicStyles.iosButtonText]}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <DateTimePicker
                        value={value}
                        mode={mode}
                        display="spinner"
                        onChange={onChange}
                        themeVariant={isDark ? "dark" : "light"}
                        textColor={colors.text}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    // Web Styles
    webModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        // backdropFilter handled in dynamic styles with cast
    },
    webCard: {
        backgroundColor: 'white',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        minWidth: 320,
    },
    webTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 24,
        letterSpacing: -0.5,
    },
    webInput: {
        fontSize: 32,
        padding: 12,
        borderRadius: 12,
        marginBottom: 32,
        textAlign: 'center',
        fontWeight: '700',
        // @ts-ignore
        border: 'none',
        outline: 'none',
        fontFamily: 'inherit',
    } as any,
    webButtons: {
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        width: '100%',
        alignItems: 'center',
    },
    closeText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    },

    // iOS Styles
    iosModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    iosCard: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    iosHeader: {
        padding: 20,
        alignItems: 'flex-end',
        borderBottomWidth: 0,
        backgroundColor: 'transparent',
    },
    iosButtonText: {
        fontSize: 17,
        fontWeight: '700',
    },
});
