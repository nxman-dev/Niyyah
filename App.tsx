import React, { useCallback, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator'; // Import AuthNavigator
import { StatusBar } from 'expo-status-bar';
import { PrayerProvider } from './src/context/PrayerContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';
import { useFonts, Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import { Colors } from './src/constants/Colors';

import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import AchievementPopup from './src/components/AchievementPopup';
import CelebrationOverlay from './src/components/CelebrationOverlay';
import { supabase } from './src/lib/supabase';
import { ThemeProvider } from './src/context/ThemeContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading, profileStatus, refreshProfile, profileError } = useAuth();

  // Initial Auth Loading or Profile Checking
  if (isLoading || (session && profileStatus === 'loading')) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '500' }}>Checking Profile...</Text>
        </View>
      </View>
    );
  }

  // 1. Session Exists & Profile Missing -> Onboarding
  if (session && profileStatus === 'missing') {
    return (
      <NavigationContainer>
        <OnboardingNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    );
  }

  // 2. Session Exists & Profile Error -> Error Screen (Retry/Logout)
  if (session && profileStatus === 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 }}>
        <Text style={{ fontSize: 18, color: Colors.text, textAlign: 'center', marginBottom: 8, fontWeight: '600' }}>
          {profileError === 'Database Policy Error' ? 'Security Sync Error' : 'Unable to load your profile'}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.error || 'red', textAlign: 'center', marginBottom: 24 }}>
          {profileError === 'Database Policy Error'
            ? 'We detected a security policy issue (Infinite Recursion). Please sign out and try again.'
            : `Error: ${profileError || 'Unknown error'}`}
        </Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {profileError !== 'Database Policy Error' && (
            <Text
              onPress={refreshProfile}
              style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16, padding: 10 }}>
              Retry
            </Text>
          )}
          <Text
            onPress={() => supabase.auth.signOut()}
            style={{ color: Colors.error || 'red', fontWeight: 'bold', fontSize: 16, padding: 10 }}>
            Sign Out
          </Text>
        </View>
      </View>
    );
  }

  // 3. Main App Flow
  return (
    <NavigationContainer>
      {session ? <BottomTabNavigator /> : <AuthNavigator />}
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <ThemeProvider>
        <AuthProvider>
          <PrayerProvider>
            <RootNavigator />
            <AchievementPopup />
            <CelebrationOverlay />
          </PrayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
