import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart2, Trophy, Settings } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';

import AchievementsScreen from '../screens/AchievementsScreen';
import SettingsNavigator from './SettingsNavigator';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
    const { colors, isDark } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const iconSize = 24; // Lucide icons look better slightly smaller or consistent

                    if (route.name === 'Home') {
                        return <Home size={iconSize} color={color} strokeWidth={focused ? 2.5 : 1.5} />;
                    } else if (route.name === 'Progress') {
                        return <BarChart2 size={iconSize} color={color} strokeWidth={focused ? 2.5 : 1.5} />;
                    } else if (route.name === 'Achievements') {
                        return <Trophy size={iconSize} color={color} strokeWidth={focused ? 2.5 : 1.5} />;
                    } else if (route.name === 'Settings') {
                        return <Settings size={iconSize} color={color} strokeWidth={focused ? 2.5 : 1.5} />;
                    }
                    return null;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textLight,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    height: Platform.OS === 'android' ? 60 : 85, // Adjust for platform
                    paddingBottom: Platform.OS === 'android' ? 8 : 30,
                    paddingTop: 8,
                },
                tabBarLabel: ({ focused, color }) => (
                    <Text style={{
                        color,
                        fontSize: 10,
                        fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        marginBottom: 4
                    }}>
                        {route.name}
                    </Text>
                ),
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Progress" component={ProgressScreen} />

            <Tab.Screen name="Achievements" component={AchievementsScreen} />
            <Tab.Screen name="Settings" component={SettingsNavigator} />
        </Tab.Navigator>
    );
}

import { Platform, Text } from 'react-native';
