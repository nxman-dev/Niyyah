import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker'; // Removed
// import { decode } from 'base64-arraybuffer'; // Removed


import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePrayers } from '../context/PrayerContext';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ navigation }: any) {
    const { profile, user, refreshProfile } = useAuth();
    const { earnedBadges, prayers, data } = usePrayers();
    const { colors, isDark } = useTheme();

    // Stats calculation
    const totalBadges = earnedBadges.size;

    // Total Prayers Calculation (Iterate over all data)
    const totalPrayersLogged = Object.values(data).reduce((acc, day) => {
        const dayCount = Object.values(day).filter(s => s === 'Prayed' || s === 'Late').length;
        return acc + dayCount;
    }, 0);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    // Form inputs
    const [username, setUsername] = useState(profile?.username || '');
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [bio, setBio] = useState(''); // Assuming 'bio' might be in profile eventually, or we store it locally/metadata
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);

    // Populate initial state
    useEffect(() => {
        if (profile) {
            setUsername(profile.username || '');
            setFullName(profile.full_name || '');
            // Check if profile has 'bio' (dynamic property access)
            const p = profile as any;
            if (p.bio) setBio(p.bio);
            if (p.avatar_url) setAvatarUrl(p.avatar_url);
        }
    }, [profile]);

    // AVATARS CONSTANT
    const AVATARS: { [key: string]: any } = {
        'avatar_man': require('../../assets/avatars/man.png'),
        'avatar_woman': require('../../assets/avatars/woman.png'),
        'avatar_boy': require('../../assets/avatars/boy.png'),
        'avatar_girl': require('../../assets/avatars/girl.png'),
        'avatar_child_male': require('../../assets/avatars/child_male.png'),
        'avatar_child_female': require('../../assets/avatars/child_female.png'),
    };

    const AVATAR_KEYS = Object.keys(AVATARS);

    const handleAvatarSelect = async (avatarKey: string) => {
        if (!user) return;

        // Optimistic update
        setAvatarUrl(avatarKey);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    avatar_url: avatarKey,
                    updated_at: new Date()
                })
                .eq('id', user.id);

            if (error) {
                console.error("Error updating avatar:", error);
                Alert.alert("Error", "Failed to update avatar selection.");
                // Revert if needed, but for now we'll just let the next refresh handle it or keep optimistic
                return;
            }

            await refreshProfile();
        } catch (error) {
            console.error("Error in handleAvatarSelect:", error);
            Alert.alert("Error", "An unexpected error occurred.");
        }
    };

    const saveProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const updates = {
                username,
                full_name: fullName,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) {
                // If column likely missing, try without bio?
                console.warn("Update error (maybe schema mismatch?):", error);
                // Fallback attempt without bio if first fails? 
                // Alternatively, just alert user.
                throw error;
            }

            await refreshProfile();
            setIsEditing(false);
            Alert.alert("Profile Updated", "Your changes have been saved.");

        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    // Dynamic styles
    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        header: { borderBottomColor: colors.border },
        title: { color: colors.text },
        username: { color: colors.text },
        email: { color: colors.textLight },
        bio: { color: colors.text },
        label: { color: colors.textLight },
        input: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text
        },
        statCard: {
            backgroundColor: colors.surface,
            shadowOpacity: isDark ? 0 : 0.05
        },
        statValue: { color: colors.text },
        statLabel: { color: colors.textLight },
        sectionTitle: { color: colors.text },
        avatar: { borderColor: colors.surface }
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <View style={[styles.header, dynamicStyles.header]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, dynamicStyles.title]}>My Profile</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
                    <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    {/* Display Current Avatar */}
                    <View style={styles.avatarContainer}>
                        {avatarUrl && AVATARS[avatarUrl] ? (
                            <Image source={AVATARS[avatarUrl]} style={[styles.avatar, dynamicStyles.avatar]} />
                        ) : (
                            // Fallback to URL if it's an old URL, or initals
                            avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('file')) && !avatarError ? (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={[styles.avatar, dynamicStyles.avatar]}
                                    onError={(e) => {
                                        console.log("Avatar load error:", e.nativeEvent.error);
                                        setAvatarError(true);
                                    }}
                                />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder, dynamicStyles.avatar]}>
                                    <Text style={styles.avatarInitials}>
                                        {username ? username.substring(0, 2).toUpperCase() : 'PS'}
                                    </Text>
                                </View>
                            )
                        )}
                        {/* No camera icon needed anymore as selection is below */}
                    </View>

                    {/* Avatar Selection Grid (Visible when Editing) */}
                    {isEditing && (
                        <View style={styles.avatarGrid}>
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Choose Avatar</Text>
                            <View style={styles.gridContainer}>
                                {AVATAR_KEYS.map((key) => (
                                    <TouchableOpacity
                                        key={key}
                                        onPress={() => handleAvatarSelect(key)}
                                        style={[
                                            styles.avatarOption,
                                            avatarUrl === key && styles.avatarSelected
                                        ]}
                                    >
                                        <Image source={AVATARS[key]} style={styles.avatarIcon} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                    {!isEditing && (
                        <>
                            <Text style={[styles.username, dynamicStyles.username]}>{fullName || username}</Text>
                            <Text style={[styles.email, dynamicStyles.email]}>{user?.email}</Text>
                            {bio ? <Text style={[styles.bio, dynamicStyles.bio]}>{bio}</Text> : null}
                        </>
                    )}
                </View>

                {/* Edit Form */}
                {isEditing && (
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, dynamicStyles.label]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, dynamicStyles.input]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter full name"
                                placeholderTextColor={colors.textLight}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, dynamicStyles.label]}>Username</Text>
                            <TextInput
                                style={[styles.input, dynamicStyles.input]}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter username"
                                placeholderTextColor={colors.textLight}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, dynamicStyles.label]}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, dynamicStyles.input]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor={colors.textLight}
                                multiline
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={saveProfile}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Stats Grid */}
                {!isEditing && (
                    <View style={styles.statsContainer}>
                        <View style={[styles.statCard, dynamicStyles.statCard]}>
                            <View style={[styles.statIcon, { backgroundColor: isDark ? colors.background : '#E6FFFA' }]}>
                                <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
                            </View>
                            <Text style={[styles.statValue, dynamicStyles.statValue]}>{totalPrayersLogged}</Text>
                            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total Prayers</Text>
                        </View>

                        <View style={[styles.statCard, dynamicStyles.statCard]}>
                            <View style={[styles.statIcon, { backgroundColor: isDark ? colors.background : '#FEFCBF' }]}>
                                <Ionicons name="trophy-outline" size={24} color="#D69E2E" />
                            </View>
                            <Text style={[styles.statValue, dynamicStyles.statValue]}>{totalBadges}</Text>
                            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Badges Earned</Text>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1
    },
    backButton: { padding: 4 },
    title: { fontSize: 20, fontWeight: '700' },
    editButton: { padding: 8 },
    editText: { color: '#319795', fontWeight: '600', fontSize: 16 },

    content: { padding: 24 },

    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3 },
    avatarPlaceholder: { backgroundColor: '#319795', justifyContent: 'center', alignItems: 'center' },
    avatarInitials: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
    cameraIcon: {
        position: 'absolute', bottom: 0, right: 0,
        width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2
    },
    username: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
    email: { fontSize: 14, marginBottom: 8 },
    bio: { fontSize: 16, textAlign: 'center', paddingHorizontal: 32, fontStyle: 'italic' },

    form: { marginBottom: 24 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderRadius: 12, padding: 16, fontSize: 16
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    saveButton: {
        padding: 16, borderRadius: 12,
        alignItems: 'center', marginTop: 8
    },
    saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    statsContainer: { flexDirection: 'row', gap: 16 },
    statCard: {
        flex: 1, borderRadius: 16, padding: 20,
        alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8, elevation: 2
    },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
    statLabel: { fontSize: 12, fontWeight: '600' },

    // Avatar Grid Styles
    avatarGrid: { width: '100%', marginTop: 16, alignItems: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
    avatarOption: {
        padding: 4, borderRadius: 40, borderWidth: 2, borderColor: 'transparent',
    },
    avatarSelected: { borderColor: '#319795' },
    avatarIcon: { width: 60, height: 60, borderRadius: 30 },
});

