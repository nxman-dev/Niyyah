import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors } from '../constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
    progress: number; // 0 to 1
    size?: number;
    strokeWidth?: number;
    color?: string;
    backgroundColor?: string;
}

export default function CircularProgress({
    progress,
    size = 60,
    strokeWidth = 6,
    color = Colors.primary,
    backgroundColor = Colors.border,
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const animatedValue = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: 1, // Animate to 1 (full completion of the *target* progress)
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true, // SVG props often need native driver false, but we'll try standard approach or use a listener
        }).start();
    }, [progress]);

    // We need to interpolate the progress relative to the strokeDashoffset
    // However, Animated.View cannot directly animate SVG props in all versions.
    // A robust way without Reanimated is to use a wrapper or setNativeProps, 
    // or just render the Circle with the calculated offset if we accept it won't be as smooth 
    // OR use the AnimatedCircle with an Animated.Value passed to strokeDashoffset.

    // For simplicity and stability on web:
    // Let's us `AnimatedCircle` which we created.

    const strokeDashoffset = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, circumference * (1 - progress)]
    });

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                    stroke={backgroundColor}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                {/* Progress Circle */}
                <AnimatedCircle
                    stroke={color}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
        </View>
    );
}
