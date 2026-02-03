import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import UsernameScreen from '../screens/onboarding/UsernameScreen';
import InitialTimesScreen from '../screens/onboarding/InitialTimesScreen';

const Stack = createStackNavigator();

export default function OnboardingNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, // Standard slide transition
                gestureEnabled: false, // Prevent swiping back implicitly if we want forcing flow
            }}
        >
            <Stack.Screen name="Username" component={UsernameScreen} />
            <Stack.Screen name="InitialTimes" component={InitialTimesScreen} />
        </Stack.Navigator>
    );
}
