import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Rect, G, ClipPath, Defs } from 'react-native-svg';

interface DialProps {
  isActive: boolean;
}

const Dial: React.FC<DialProps> = ({ isActive }) => {
  const rotation = useRef(new Animated.Value(45)).current; // Start at 45 degrees
  const [isAnimating, setIsAnimating] = useState(false);
  const rotationAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isActive) {
      // Start continuous rotation animation
      setIsAnimating(true);
      rotationAnimationRef.current = Animated.loop(
        Animated.timing(rotation, {
          toValue: 405, // 360 + 45 to complete a full rotation
          duration: 2000, // 2 seconds per rotation (180 deg/sec)
          useNativeDriver: true,
        })
      );
      rotationAnimationRef.current.start();
    } else {
      // Stop animation
      if (rotationAnimationRef.current) {
        rotationAnimationRef.current.stop();
        rotationAnimationRef.current = null;
      }
      setIsAnimating(false);
      // Smoothly return to base position (45 degrees) over 300ms
      Animated.timing(rotation, {
        toValue: 45,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (rotationAnimationRef.current) {
        rotationAnimationRef.current.stop();
        rotationAnimationRef.current = null;
      }
    };
  }, [isActive, rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 360, 720],
    outputRange: ['0deg', '360deg', '720deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dialWrapper,
          {
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 81 81" preserveAspectRatio="xMidYMid meet">
          {/* Outer circle */}
          <Rect width={81} height={81} rx={40.5} fill="#656565" />
          <G clipPath="url(#clip0_dial)">
            {/* Inner circle */}
            <Rect x={2} y={2} width={77} height={77} rx={38.5} fill="#B5B5B5" />
            {/* Horizontal line */}
            <Rect x={1} y={39.7725} width={79} height={1} fill="#656565" />
            <Rect x={1} y={40.7725} width={79} height={1} fill="#6E6E6E" />
          </G>
          <Defs>
            <ClipPath id="clip0_dial">
              <Rect x={2} y={2} width={77} height={77} rx={38.5} fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dialWrapper: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Dial;

