import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { PRAYER_TIMES, getPrayerTimes, hasTimePassed, getDateFromTime } from '../constants/PrayerTimes';
import { BADGES } from '../constants/Badges';
import { useAuth } from './AuthContext';

export type PrayerStatus = 'Pending' | 'Prayed' | 'Missed' | 'Late';

export interface Prayer {
    id: string;
    name: string;
    status: PrayerStatus;
    startTime?: string;
    mosqueTime?: string;
    endTime?: string;
}

interface PrayerData {
    [date: string]: {
        [prayerId: string]: PrayerStatus;
    };
}

export interface PrayerTimeConfig {
    id: string;
    startTime: string;
    mosqueTime?: string; // NEW: Optional Mosque Time
    endTime: string;
}

interface Settings {
    notificationsEnabled: boolean;
    reminderLeadTime: number; // in minutes
    prayerTimes: PrayerTimeConfig[];
}

interface PrayerContextType {
    prayers: Prayer[];
    streak: number;
    longestStreak: number;
    settings: Settings;
    markAsPrayed: (prayerId: string) => Promise<void>;
    toggleNotifications: (enabled: boolean) => Promise<void>;
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
    resetData: () => Promise<void>;
    isLoading: boolean;
    getWeeklyProgress: () => number[];
    getToDaysRatio: () => { completed: number; total: number };
    getBadgeProgress: (id: string) => { current: number; total: number };
    data: PrayerData; // Exposed for Calendar
    earnedBadges: Set<string>;
    newBadge: string | null;
    clearNewBadge: () => void;
    refreshTodayPrayers: () => Promise<void>;
}

const DEFAULT_PRAYER_TIMES: PrayerTimeConfig[] = [
    { id: '1', startTime: '05:00', mosqueTime: undefined, endTime: '06:30' },
    { id: '2', startTime: '12:30', mosqueTime: undefined, endTime: '15:45' },
    { id: '3', startTime: '15:45', mosqueTime: undefined, endTime: '18:15' },
    { id: '4', startTime: '18:15', mosqueTime: undefined, endTime: '19:40' },
    { id: '5', startTime: '19:40', mosqueTime: undefined, endTime: '23:59' },
];

const PrayerContext = createContext<PrayerContextType>({
    prayers: [],
    streak: 0,
    longestStreak: 0,
    settings: { notificationsEnabled: false, reminderLeadTime: 15, prayerTimes: DEFAULT_PRAYER_TIMES },
    markAsPrayed: async () => { },
    toggleNotifications: async () => { },
    updateSettings: async () => { },
    resetData: async () => { },
    isLoading: true,
    getWeeklyProgress: () => [],
    getToDaysRatio: () => ({ completed: 0, total: 5 }),
    getBadgeProgress: () => ({ current: 0, total: 0 }),
    data: {},
    earnedBadges: new Set(),
    newBadge: null,
    clearNewBadge: () => { },
    refreshTodayPrayers: async () => { },
});

export const usePrayers = () => useContext(PrayerContext);

const INITIAL_PRAYERS = [
    { id: '1', name: 'Fajr' },
    { id: '2', name: 'Dhuhr' },
    { id: '3', name: 'Asr' },
    { id: '4', name: 'Maghrib' },
    { id: '5', name: 'Isha' },
];

const STORAGE_KEYS = {
    DATA: '@prayer_streak_data',
    STREAK: '@prayer_streak_count',
    LONGEST_STREAK: '@prayer_streak_longest',
    LAST_COMPLETED: '@prayer_streak_last_date',
    SETTINGS: '@prayer_streak_settings_v2', // Versioned
};

if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

export function PrayerProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth(); // Depend on Auth Context
    const [data, setData] = useState<PrayerData>({});
    const [streak, setStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [settings, setSettings] = useState<Settings>({
        notificationsEnabled: false,
        reminderLeadTime: 15,
        prayerTimes: DEFAULT_PRAYER_TIMES
    });
    const [isLoading, setIsLoading] = useState(true);
    const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
    const [newBadge, setNewBadge] = useState<string | null>(null);

    const clearNewBadge = () => setNewBadge(null);

    // DAILY LOCKOUT / MISS LOGIC
    useEffect(() => {
        loadLocalData();
        const interval = setInterval(() => checkAutoMissed(), 60000);
        return () => clearInterval(interval);
    }, []);

    // SYNC SETTINGS (When Profile Loads)
    useEffect(() => {
        if (profile) {
            syncCloudSettings();
        }
    }, [profile]);

    // Re-schedule notifications whenever settings change (if enabled)
    useEffect(() => {
        if (!isLoading && settings.notificationsEnabled) {
            scheduleNotifications();
        }
    }, [settings.prayerTimes, settings.reminderLeadTime]);

    const loadLocalData = async () => {
        try {
            const [storedData, storedStreak, storedLongest, lastDate, storedSettings] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.DATA),
                AsyncStorage.getItem(STORAGE_KEYS.STREAK),
                AsyncStorage.getItem(STORAGE_KEYS.LONGEST_STREAK),
                AsyncStorage.getItem(STORAGE_KEYS.LAST_COMPLETED),
                AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
            ]);

            const parsedData: PrayerData = storedData ? JSON.parse(storedData) : {};
            let currentStreak = storedStreak ? parseInt(storedStreak, 10) : 0;
            const savedLongest = storedLongest ? parseInt(storedLongest, 10) : 0;

            // Local Settings
            let parsedSettings = storedSettings ? JSON.parse(storedSettings) : {};
            const finalSettings: Settings = {
                notificationsEnabled: parsedSettings.notificationsEnabled || false,
                reminderLeadTime: parsedSettings.reminderLeadTime || 15,
                prayerTimes: parsedSettings.prayerTimes || DEFAULT_PRAYER_TIMES,
            };

            setData(parsedData);
            setLongestStreak(savedLongest);
            setSettings(finalSettings);

            // Streak Reset Logic
            const today = getTodayDate();
            if (lastDate && lastDate !== today) {
                const last = new Date(lastDate);
                const now = new Date(today);
                const diffTime = Math.abs(now.getTime() - last.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 1) {
                    currentStreak = 0;
                    await AsyncStorage.setItem(STORAGE_KEYS.STREAK, '0');
                }
            }
            setStreak(currentStreak);

            // Check auto-miss with local data
            checkAutoMissed(parsedData, finalSettings);

        } catch (e) {
            console.error('Failed to load local prayer data', e);
        } finally {
            setIsLoading(false);
        }
    };

    const syncCloudSettings = async () => {
        if (!user || !profile) return;
        try {
            // NOTE: This is a SECONDARY fetch. It happens AFTER the main profile load.
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('prayer_settings')
                .eq('id', user.id)
                .single();

            if (profileData?.prayer_settings) {
                const cloudSettings = profileData.prayer_settings;
                setSettings(prev => ({ ...prev, ...cloudSettings }));
                await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...settings, ...cloudSettings }));
            }

            // Fetch Achievements
            const { data: achievements } = await supabase
                .from('achievements')
                .select('badge_type')
                .eq('user_id', user.id);

            if (achievements) {
                const earnedSet = new Set(achievements.map((a: any) => a.badge_type));
                setEarnedBadges(earnedSet);
            }

        } catch (err) {
            console.log("Error syncing cloud data", err);
        }
    };

    const getTodayDate = () => new Date().toISOString().split('T')[0];

    const checkAutoMissed = async (currentData = data, currentSettings = settings) => {
        const today = getTodayDate();
        const todaysStatus = currentData[today] || {};
        let hasChanges = false;
        const newData = { ...currentData };
        if (!newData[today]) newData[today] = {};

        currentSettings.prayerTimes.forEach(pt => {
            const status = todaysStatus[pt.id] || 'Pending';
            if (status === 'Pending') {
                if (hasTimePassed(pt.endTime)) {
                    newData[today][pt.id] = 'Missed';
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            setData(newData);
            await AsyncStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(newData));
        }
    };

    const getBadgeProgress = (id: string, customData?: PrayerData, customStreak?: number) => {
        const d = customData || data;
        const s = customStreak ?? streak;

        const badge = BADGES.find(b => b.id === id);
        if (!badge) return { current: 0, total: 0 };

        if (badge.type === 'streak') return { current: s, total: badge.requirement };

        if (badge.type === 'late_prayers') {
            let lateCount = 0;
            Object.values(d).forEach(day => {
                Object.values(day).forEach(status => {
                    if (status === 'Late') lateCount++;
                });
            });
            return { current: lateCount, total: badge.requirement };
        }

        if (badge.type === 'total_prayers') {
            let fullDays = 0;
            Object.values(d).forEach(day => {
                const count = Object.values(day).filter(status => status === 'Prayed' || status === 'Late').length;
                if (count === 5) fullDays++;
            });
            return { current: fullDays, total: badge.requirement };
        }

        if (badge.type === 'fajr_streak') {
            let fStreak = 0;
            const sortedDates = Object.keys(d).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            for (const dateKey of sortedDates) {
                const status = d[dateKey]?.['1'];
                if (status === 'Prayed' || status === 'Late') fStreak++;
                else break;
            }
            return { current: fStreak, total: badge.requirement };
        }

        return { current: 0, total: badge.requirement };
    };

    const checkStreak = async (currentData: PrayerData, today: string) => {
        const todaysPrayers = currentData[today] || {};
        const allPrayed = INITIAL_PRAYERS.every(p => {
            const s = todaysPrayers[p.id];
            return s === 'Prayed' || s === 'Late';
        });

        let currentStreak = streak;

        if (allPrayed) {
            const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_COMPLETED);

            if (lastDate !== today) {
                // Check if last date was yesterday
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yesterdayStr) {
                    currentStreak += 1;
                } else {
                    // If lastDate exists but not yesterday, reset to 1. 
                    // If no lastDate, start at 1.
                    currentStreak = 1;
                }

                setStreak(currentStreak);
                await AsyncStorage.setItem(STORAGE_KEYS.STREAK, currentStreak.toString());
                await AsyncStorage.setItem(STORAGE_KEYS.LAST_COMPLETED, today);

                if (currentStreak > longestStreak) {
                    setLongestStreak(currentStreak);
                    await AsyncStorage.setItem(STORAGE_KEYS.LONGEST_STREAK, currentStreak.toString());
                }
            }
        }
        return currentStreak;
    };

    const unlockBadge = async (badgeId: string) => {
        if (earnedBadges.has(badgeId)) return;

        // Optimistic Update
        const newSet = new Set(earnedBadges);
        newSet.add(badgeId);
        setEarnedBadges(newSet);
        setNewBadge(badgeId);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            try {
                const { error } = await supabase
                    .from('achievements')
                    .insert({
                        user_id: session.user.id,
                        badge_type: badgeId
                    });

                if (error) {
                    console.error("Error inserting achievement:", error);
                } else {
                    console.log(`Achievement Unlocked: ${badgeId}`);
                }
            } catch (e) {
                console.log("Achievement unlock failed", e);
            }
        }
    };

    const checkAchievements = async (currentData: PrayerData, currentStreak: number) => {
        for (const badge of BADGES) {
            if (earnedBadges.has(badge.id)) continue;

            const { current } = getBadgeProgress(badge.id, currentData, currentStreak);

            if (current >= badge.requirement) {
                await unlockBadge(badge.id);
            }
        }
    };

    const markAsPrayed = async (prayerId: string) => {
        console.log(`[markAsPrayed] Tapped prayer: ${prayerId}`);

        // 1. Identity Check
        if (!user || !user.id) {
            console.error("[markAsPrayed] No authenticated user ID found.");
            Alert.alert("Error", "Please sign in again to save progress.");
            return;
        }

        // 2. Strict Date Format (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // COPY STATE FOR ROLLBACK
        const previousData = { ...data };
        const previousStreak = streak;
        const previousLongest = longestStreak;
        const previousLastCompleted = await AsyncStorage.getItem(STORAGE_KEYS.LAST_COMPLETED);

        const currentStatus = data[today]?.[prayerId] || 'Pending';
        console.log(`[markAsPrayed] Status: ${currentStatus} | Date: ${today}`);

        let targetStatus: PrayerStatus = 'Pending';

        // --- LOGIC START ---
        if (currentStatus === 'Prayed' || currentStatus === 'Late') {
            // CASE: Unmarking. Completely skip time checks.
            console.log("[markAsPrayed] Action: Unmarking (Reset to Pending)");
            targetStatus = 'Pending';
        } else {
            // CASE: Marking. Perform strict time validation.
            console.log("[markAsPrayed] Action: Marking as Done");

            const prayerConfig = settings.prayerTimes.find(pt => pt.id === prayerId);

            if (!prayerConfig) {
                Alert.alert("Error", "Configuration missing.");
                return;
            }

            const timeToCheck = prayerConfig.mosqueTime || prayerConfig.startTime;
            if (!hasTimePassed(timeToCheck)) {
                console.log(`[markAsPrayed] Too Early. Now < ${timeToCheck}. Blocking.`);
                Alert.alert('Wait!', `This prayer hasn't started yet (${timeToCheck}).`);
                return; // Stop execution
            }

            targetStatus = 'Prayed';
            if (hasTimePassed(prayerConfig.endTime)) {
                targetStatus = 'Late';
            }
        }
        // --- LOGIC END ---

        // --- OPTIMISTIC UPDATE START ---
        try {
            const newData = { ...data };
            if (!newData[today]) newData[today] = {};
            newData[today][prayerId] = targetStatus;

            // Apply Local
            setData(newData);
            await AsyncStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(newData));

            // Calc and set optimistic streak
            const updatedStreak = await checkStreak(newData, today);
            await checkAchievements(newData, updatedStreak);

            if (targetStatus === 'Prayed' || targetStatus === 'Late') {
                if (Platform.OS !== 'web') {
                    await Notifications.cancelScheduledNotificationAsync(`${prayerId}_reminder`);
                }
            }
            // --- OPTIMISTIC UPDATE END ---

            // --- SYNC START ---
            const prayerName = INITIAL_PRAYERS.find(p => p.id === prayerId)?.name || 'Prayer';
            console.log(`[markAsPrayed] Syncing ${prayerName} to ${targetStatus} using Composite Key`);

            // UPSERT using user_id + date + prayer_name
            const { error: upsertError } = await supabase
                .from('prayers')
                .upsert({
                    user_id: user.id,
                    prayer_name: prayerName,
                    status: targetStatus,
                    date: today
                }, {
                    onConflict: 'user_id, date, prayer_name'
                });

            if (upsertError) {
                console.error("[markAsPrayed] Upsert Failed:", upsertError);
                throw upsertError;
            }

            console.log("[markAsPrayed] Sync Success.");

        } catch (error: any) {
            console.error("[markAsPrayed] CRITICAL ERROR & ROLLBACK:", error);

            // --- ROLLBACK START ---
            setData(previousData);
            setStreak(previousStreak);
            setLongestStreak(previousLongest);
            await AsyncStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(previousData));
            await AsyncStorage.setItem(STORAGE_KEYS.STREAK, previousStreak.toString());
            await AsyncStorage.setItem(STORAGE_KEYS.LONGEST_STREAK, previousLongest.toString());
            if (previousLastCompleted) {
                await AsyncStorage.setItem(STORAGE_KEYS.LAST_COMPLETED, previousLastCompleted);
            }
            // --- ROLLBACK END ---

            Alert.alert("Sync Error", `Failed to save ${targetStatus}. Changes reverted.\n${error.message || ''}`);
        }
    };

    const refreshTodayPrayers = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const today = getTodayDate();
            console.log("Force refreshing today's prayers for:", today);

            const { data: serverPrayers, error } = await supabase
                .from('prayers')
                .select('prayer_name, status')
                .eq('user_id', user.id)
                .eq('date', today);

            if (error) throw error;

            if (serverPrayers) {
                // Map names to IDs
                const nameToId: Record<string, string> = {};
                INITIAL_PRAYERS.forEach(p => { nameToId[p.name] = p.id; });

                const newData = { ...data };
                if (!newData[today]) newData[today] = {};

                // Update exclusively directly from server
                serverPrayers.forEach((record: any) => {
                    const id = nameToId[record.prayer_name];
                    if (id) {
                        newData[today][id] = record.status;
                    }
                });

                setData(newData);
                await AsyncStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(newData));

                // Re-calc streak
                await checkStreak(newData, today);
            }
        } catch (error) {
            console.error("Error refreshing today's prayers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTodaysPrayers = (): Prayer[] => {
        const today = getTodayDate();
        const todaysStatuses = data[today] || {};
        const configMap = new Map(settings.prayerTimes.map(pt => [pt.id, pt]));

        return INITIAL_PRAYERS.map(p => {
            const config = configMap.get(p.id);
            return {
                ...p,
                status: todaysStatuses[p.id] || 'Pending',
                startTime: config?.startTime,
                mosqueTime: config?.mosqueTime,
                endTime: config?.endTime,
            };
        });
    };

    const updateSettings = async (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

        // Sync to Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            try {
                await supabase.from('profiles').update({
                    prayer_settings: updated,
                    updated_at: new Date()
                }).eq('id', session.user.id);
            } catch (err) {
                console.log("Supabase settings sync error", err);
            }
        }
    };

    const toggleNotifications = async (enabled: boolean) => {
        await updateSettings({ notificationsEnabled: enabled });
        if (enabled) {
            await scheduleNotifications();
        } else {
            await cancelAllNotifications();
        }
    };

    // Notification Logic
    const registerForPushNotificationsAsync = async () => {
        if (Platform.OS === 'web') return false;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    };

    const cancelAllNotifications = async () => {
        if (Platform.OS === 'web') return;
        await Notifications.cancelAllScheduledNotificationsAsync();
    };

    const scheduleNotifications = async () => {
        if (Platform.OS === 'web') return;

        // Permissions check
        const { status } = await Notifications.getPermissionsAsync();
        let finalStatus = status;
        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            finalStatus = newStatus;
        }
        if (finalStatus !== 'granted') return;

        await cancelAllNotifications();

        const todayDate = getTodayDate();

        // For each prayer, schedule START and REMINDER
        for (const pt of settings.prayerTimes) {
            const pName = INITIAL_PRAYERS.find(p => p.id === pt.id)?.name || 'Prayer';

            // 1. Start Notification (Prioritize Mosque Time)
            const triggerTime = pt.mosqueTime || pt.startTime;
            const startDate = getDateFromTime(triggerTime);
            if (startDate > new Date()) {
                await Notifications.scheduleNotificationAsync({
                    identifier: `${pt.id}_start`,
                    content: {
                        title: `Time for ${pName}`,
                        body: pt.mosqueTime ? `Jamaat time for ${pName}.` : `It is now time for ${pName}.`,
                        sound: true,
                    },
                    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: startDate },
                });
            }

            // 2. Reminder (Lead Time before End)
            const endDate = getDateFromTime(pt.endTime);
            const reminderDate = new Date(endDate.getTime() - settings.reminderLeadTime * 60000);

            if (reminderDate > new Date()) {
                await Notifications.scheduleNotificationAsync({
                    identifier: `${pt.id}_reminder`,
                    content: {
                        title: `${pName} Ending Soon`,
                        body: `${settings.reminderLeadTime} minutes remaining for ${pName}!`,
                        sound: true,
                    },
                    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
                });
            }
        }
    };

    const getToDaysRatio = () => {
        const today = getTodayDate();
        const statuses = data[today] || {};
        const completed = Object.values(statuses).filter(s => s === 'Prayed' || s === 'Late').length;
        return { completed, total: 5 };
    };

    const getWeeklyProgress = (): number[] => {
        const counts: number[] = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = data[dateStr] || {};
            const count = Object.values(dayData).filter(s => s === 'Prayed' || s === 'Late').length;
            counts.push(count);
        }
        return counts;
    };

    const resetData = async () => {
        await AsyncStorage.clear();
        setData({});
        setStreak(0);
        setLongestStreak(0);
        setSettings({ notificationsEnabled: false, reminderLeadTime: 15, prayerTimes: DEFAULT_PRAYER_TIMES });
        await cancelAllNotifications();
    };

    return (
        <PrayerContext.Provider value={{
            prayers: getTodaysPrayers(),
            streak,
            longestStreak,
            settings,
            markAsPrayed,
            toggleNotifications,
            updateSettings,
            resetData,
            isLoading,
            getWeeklyProgress,
            getToDaysRatio,
            getBadgeProgress,
            data,
            earnedBadges,
            newBadge,
            clearNewBadge,
            refreshTodayPrayers
        }}>
            {children}
        </PrayerContext.Provider>
    );
}
