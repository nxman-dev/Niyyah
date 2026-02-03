import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

interface Props {
    progress: number; // 0 to 1
}

export default function OnboardingProgressBar({ progress }: Props) {
    const progressWidth = useSharedValue(0);

    useEffect(() => {
        progressWidth.value = withTiming(progress, { duration: 500 });
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progressWidth.value * 100}%`,
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.track}>
                <Animated.View style={[styles.bar, animatedStyle]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        marginTop: 40,
    },
    track: {
        height: 6,
        backgroundColor: Colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
});
