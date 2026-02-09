/**
 * ConfettiCannon — lightweight confetti burst animation using Animated API.
 * Renders a burst of colorful rectangles that fall from the top.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1',
  '#FF9FF3', '#FFA502', '#7BED9F', '#70A1FF', '#FF4757',
  '#2ED573', '#ECCC68', '#FF6348', '#5352ED', '#1E90FF',
];

const PIECE_COUNT = 60;

type Piece = {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  isCircle: boolean;
};

type Props = {
  active: boolean;
  onComplete?: () => void;
};

export default function ConfettiCannon({ active, onComplete }: Props) {
  const pieces = useRef<Piece[]>([]);

  if (pieces.current.length === 0) {
    pieces.current = Array.from({ length: PIECE_COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      isCircle: Math.random() > 0.6,
    }));
  }

  useEffect(() => {
    if (!active) return;

    const animations = pieces.current.map((piece) => {
      // Reset values
      piece.x.setValue(SCREEN_W * 0.3 + Math.random() * SCREEN_W * 0.4);
      piece.y.setValue(-20);
      piece.rotation.setValue(0);
      piece.opacity.setValue(1);

      const targetX = (Math.random() - 0.5) * SCREEN_W * 1.2 + SCREEN_W / 2;
      const duration = 1800 + Math.random() * 1200;

      return Animated.parallel([
        Animated.timing(piece.x, {
          toValue: targetX,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(piece.y, {
          toValue: SCREEN_H + 50,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: 4 + Math.random() * 8,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(piece.opacity, {
          toValue: 0,
          duration,
          delay: duration * 0.6,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(20, animations).start(() => {
      onComplete?.();
    });
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.current.map((piece, i) => (
        <Animated.View
          key={i}
          style={[
            {
              position: 'absolute',
              width: piece.size,
              height: piece.isCircle ? piece.size : piece.size * 2.5,
              backgroundColor: piece.color,
              borderRadius: piece.isCircle ? piece.size / 2 : 2,
              opacity: piece.opacity,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}
