import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Alert, SafeAreaView, ScrollView, Platform, Modal } from 'react-native';
import { Colors } from '../constants/Colors';
import { usePrayers } from '../context/PrayerContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function SettingsScreen({ navigation }: any) {
    const { settings, toggleNotifications, updateSettings, resetData } = usePrayers();

    const handleReset = () => {
        Alert.alert(
            "Reset All Data",
            "Are you sure? This deletes streaks and progress.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: resetData }
            ]
        );
    };

    const increaseLeadTime = () => {
        if (settings.reminderLeadTime < 60) {
            updateSettings({ reminderLeadTime: settings.reminderLeadTime + 5 });
        }
    };

    const decreaseLeadTime = () => {
        if (settings.reminderLeadTime > 5) {
            updateSettings({ reminderLeadTime: settings.reminderLeadTime - 5 });
        }
    };

    const handleSignOut = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Sign Out\n\nAre you sure? Your streak progress is safe in the cloud.")) {
                await supabase.auth.signOut();
                window.location.reload(); // Force reload on web
            }
        } else {
            Alert.alert(
                "Sign Out",
                "Are you sure? Your streak progress is safe in the cloud.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Sign Out",
                        style: "destructive",
                        onPress: async () => {
                            await supabase.auth.signOut();
                        }
                    }
                ]
            );
        }
    };

    const handleAddAccount = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Switch Account\n\nYou will be signed out to create a new account.")) {
                await supabase.auth.signOut();
                window.location.reload(); // Force reload on web
            }
        } else {
            Alert.alert(
                "Switch Account",
                "You will be signed out to create a new account.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Continue",
                        onPress: async () => {
                            await supabase.auth.signOut();
                            // Note: App.tsx will switch to AuthNavigator (Login). 
                            // Direct navigation to Signup is not possible after unmount.
                        }
                    }
                ]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.titleText}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* General Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={styles.label}>Enable Reminders</Text>
                            <Text style={styles.subLabel}>Get notified for prayer times</Text>
                        </View>
                        <Switch
                            trackColor={{ false: Colors.inactive, true: Colors.primary }}
                            thumbColor={Colors.surface}
                            onValueChange={toggleNotifications}
                            value={settings.notificationsEnabled}
                        />
                    </View>

                    <View style={[styles.row, { marginTop: 16 }]}>
                        <View style={styles.rowText}>
                            <Text style={styles.label}>Reminder Lead Time</Text>
                            <Text style={styles.subLabel}>Alert before prayer ends</Text>
                        </View>
                        <View style={styles.stepper}>
                            <TouchableOpacity onPress={decreaseLeadTime} style={styles.stepperBtn}>
                                <Ionicons name="remove" size={20} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.stepperValue}>{settings.reminderLeadTime}m</Text>
                            <TouchableOpacity onPress={increaseLeadTime} style={styles.stepperBtn}>
                                <Ionicons name="add" size={20} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Prayer Times Configuration */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Prayer Schedule</Text>
                    <Text style={styles.description}>Customize Start, Mosque, and End times for your location.</Text>

                    <TouchableOpacity
                        style={styles.configButton}
                        onPress={() => navigation.navigate('PrayerTimes')}
                    >
                        <Text style={styles.configButtonText}>Configure Prayer Times</Text>
                        <Ionicons name="chevron-forward" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Account Management */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity style={[styles.accountButton, { marginBottom: 12 }]} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
                        <Text style={styles.accountButtonText}>View Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.accountButton} onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
                        <Text style={styles.accountButtonText}>Sign Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.accountButton, { marginTop: 12 }]} onPress={handleAddAccount}>
                        <Ionicons name="people-outline" size={20} color={Colors.primary} />
                        <Text style={styles.accountButtonText}>Add Another Account</Text>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#E53E3E' }]}>Danger Zone</Text>
                    <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                        <Ionicons name="trash-outline" size={20} color="#FFF" />
                        <Text style={styles.resetText}>Reset All Data</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Prayer Streak v1.2.0 (Power User)</Text>
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
    scrollContent: {
        padding: 24,
    },
    section: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primaryDark,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 16,
        lineHeight: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowText: {
        flex: 1,
        paddingRight: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    subLabel: {
        fontSize: 13,
        color: Colors.textLight,
    },
    resetButton: {
        backgroundColor: '#E53E3E', // Red
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 8,
    },
    resetText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    configButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
    },
    configButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    versionText: {
        color: Colors.textLight,
        fontSize: 12,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 8,
        padding: 4,
    },
    stepperBtn: {
        padding: 8,
    },
    stepperValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        minWidth: 40,
        textAlign: 'center',
    },
    accountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },
    accountButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
});
