import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Profile = {
    id: string;
    username: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    prayer_settings?: any; // Fetched separately in PrayerContext now to avoid recursion risks
};

export type ProfileStatus = 'idle' | 'loading' | 'success' | 'missing' | 'error';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    profileStatus: ProfileStatus;
    profileError: string | null;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    profileStatus: 'idle',
    profileError: null,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
    const [profileError, setProfileError] = useState<string | null>(null);

    const fetchProfile = async (userId: string) => {
        setProfileStatus('loading');
        setProfileError(null); // Clear previous errors immediately
        try {
            // Check specifically for existence using maybeSingle to avoid 406 errors for missing rows
            // Fetch ONLY necessary columns to avoid triggering extra RLS policies
            console.log('[AuthContext] Fetching Profile Start...');
            console.log('Fetching profile for UID:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, prayer_settings')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Error fetching profile object:', JSON.stringify(error));
                const errMsg = (error.message || JSON.stringify(error)).toLowerCase();

                if (errMsg.includes('recursion') || errMsg.includes('policy')) {
                    setProfileError('Database Policy Error');
                    setProfileStatus('error');
                    return;
                }

                setProfileError(error.message);
                setProfileStatus('error');
            } else if (data) {
                setProfile(data);
                setProfileStatus('success');
                console.log('[AuthContext] Fetching Profile Success');
            } else {
                // No profile found (data is null, but no error)
                setProfileStatus('missing');
                setProfile(null);
            }
        } catch (e: any) {
            console.error('Exception fetching profile:', e);
            const errMsg = (e.message || JSON.stringify(e)).toLowerCase();

            // Check for recursion error specifically
            if (errMsg.includes('recursion') || errMsg.includes('policy')) {
                setProfileError('Database Policy Error');
                setProfileStatus('error');
                return; // Stop here, do not retry
            }

            setProfileError(e.message || 'Unknown exception');
            setProfileStatus('error');
        }
    };

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setIsLoading(false));
            } else {
                setIsLoading(false);
            }
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setIsLoading(false));
            } else {
                setProfile(null);
                setProfileStatus('idle');
                setProfileError(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, isLoading, profileStatus, profileError, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
