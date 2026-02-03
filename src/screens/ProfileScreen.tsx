import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { usePrayers } from '../context/PrayerContext';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ navigation }: any) {
    const { profile, user, refreshProfile } = useAuth();
    const { earnedBadges, prayers, data } = usePrayers();

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

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    uploadAvatar(asset.uri);
                }
            }
        } catch (error) {
            Alert.alert("Error picking image", "Please try again.");
        }
    };

    const uploadAvatar = async (uri: string) => {
        if (!user) {
            Alert.alert("Error", "You must be logged in to upload.");
            return;
        }
        setUploading(true);
        console.log('Starting upload for:', uri);

        try {
            // 1. Prepare Blob (Using fetch)
            let blob: Blob;
            try {
                const response = await fetch(uri);
                blob = await response.blob();
            } catch (fetchErr: any) {
                console.error("Blob creation failed:", fetchErr);
                Alert.alert("Error", "Failed to process image file.");
                setUploading(false);
                return;
            }

            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${user.id}/profile.${fileExt}`;
            const filePath = `${fileName}`;

            // 2. Upload to Supabase (Pass Blob directly)
            console.log('Uploading Blob to path:', filePath);
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, {
                    contentType: `image/${fileExt}`,
                    upsert: true
                });

            if (uploadError) {
                console.error("Supabase Upload Error:", uploadError);
                Alert.alert("Upload Failed", uploadError.message || "Storage rejected the file.");
                setUploading(false);
                return;
            }

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const finalUrl = `${publicUrl}?t=${new Date().getTime()}`;
            console.log('Generated Public URL:', finalUrl);
            setAvatarUrl(finalUrl);

            // 4. Update Profile DB
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: finalUrl })
                .eq('id', user.id);

            if (updateError) {
                console.error("DB Update Error:", updateError);
                Alert.alert("Save Failed", "Image uploaded but profile not updated.");
                setUploading(false);
                return;
            }

            await refreshProfile();
            Alert.alert("Success", "Profile picture updated!");

        } catch (error: any) {
            console.error("Unexpected Upload error:", error);
            Alert.alert("Error", error.message || "An unexpected error occurred.");
        } finally {
            setUploading(false);
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
                // Try to update bio if the column exists, otherwise this might throw or be ignored depending on Supabase implementation
                // safer approach: try/catch specialized or just send it.
                // Given user request, I'll attempt to send it.
                bio: bio
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>My Profile</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
                    <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} disabled={uploading}>
                        <View style={styles.avatarContainer}>
                            {uploading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                        <Text style={styles.avatarInitials}>
                                            {username ? username.substring(0, 2).toUpperCase() : 'PS'}
                                        </Text>
                                    </View>
                                )
                            )}
                            <View style={styles.cameraIcon}>
                                <Ionicons name="camera" size={16} color="#FFF" />
                            </View>
                        </View>
                    </TouchableOpacity>
                    {!isEditing && (
                        <>
                            <Text style={styles.username}>{fullName || username}</Text>
                            <Text style={styles.email}>{user?.email}</Text>
                            {bio ? <Text style={styles.bio}>{bio}</Text> : null}
                        </>
                    )}
                </View>

                {/* Edit Form */}
                {isEditing && (
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter full name"
                                placeholderTextColor={Colors.textLight}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter username"
                                placeholderTextColor={Colors.textLight}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor={Colors.textLight}
                                multiline
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
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
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#E6FFFA' }]}>
                                <Ionicons name="checkmark-circle-outline" size={24} color={Colors.primary} />
                            </View>
                            <Text style={styles.statValue}>{totalPrayersLogged}</Text>
                            <Text style={styles.statLabel}>Total Prayers</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#FEFCBF' }]}>
                                <Ionicons name="trophy-outline" size={24} color="#D69E2E" />
                            </View>
                            <Text style={styles.statValue}>{totalBadges}</Text>
                            <Text style={styles.statLabel}>Badges Earned</Text>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border
    },
    backButton: { padding: 4 },
    title: { fontSize: 20, fontWeight: '700', color: Colors.text },
    editButton: { padding: 8 },
    editText: { color: Colors.primary, fontWeight: '600', fontSize: 16 },

    content: { padding: 24 },

    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.surface },
    avatarPlaceholder: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarInitials: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
    cameraIcon: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary,
        width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: Colors.background
    },
    username: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    email: { fontSize: 14, color: Colors.textLight, marginBottom: 8 },
    bio: { fontSize: 16, color: Colors.text, textAlign: 'center', paddingHorizontal: 32, fontStyle: 'italic' },

    form: { marginBottom: 24 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, color: Colors.textLight, marginBottom: 8, fontWeight: '600' },
    input: {
        backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
        borderRadius: 12, padding: 16, fontSize: 16, color: Colors.text
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    saveButton: {
        backgroundColor: Colors.primary, padding: 16, borderRadius: 12,
        alignItems: 'center', marginTop: 8
    },
    saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    statsContainer: { flexDirection: 'row', gap: 16 },
    statCard: {
        flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 20,
        alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    statLabel: { fontSize: 12, color: Colors.textLight, fontWeight: '600' }
});
