import React, { useCallback } from 'react';
import { Pressable, View, Text } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const DEPTH = 6;

interface PixelLetsGoButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

function SparkleCluster({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <View style={{ width: 44, alignItems: isLeft ? 'flex-start' : 'flex-end' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 22, lineHeight: 24 }}>✦</Text>
        <Text style={{ color: '#99EEFF', fontSize: 10, lineHeight: 12, marginBottom: 4 }}>✦</Text>
      </View>
      <Text
        style={{
          color: isLeft ? '#99EEFF' : '#FFFFFF',
          fontSize: 12,
          lineHeight: 14,
          marginTop: 2,
          marginLeft: isLeft ? 8 : 0,
          marginRight: isLeft ? 0 : 8,
        }}
      >
        ✦
      </Text>
    </View>
  );
}

export const PixelLetsGoButton: React.FC<PixelLetsGoButtonProps> = ({ onPress, disabled }) => {
  const press = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    press.value = withTiming(1, { duration: 80 });
  }, [press]);

  const handlePressOut = useCallback(() => {
    press.value = withTiming(0, { duration: 120 });
  }, [press]);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(press.value, [0, 1], [0, DEPTH]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={{ paddingBottom: DEPTH, opacity: disabled ? 0.5 : 1 }}
      accessibilityRole="button"
      accessibilityLabel="Let's go"
    >
      {/* Depth layer — sits at the bottom; visually covered when button presses down */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          top: DEPTH,
          backgroundColor: '#D0CCEE',
          borderRadius: 16,
        }}
      />

      <Animated.View style={buttonAnimStyle}>
        {/* Outer light-lavender frame */}
        <View style={{ backgroundColor: '#E8E4F6', borderRadius: 16, padding: 3 }}>
          {/* Hot-pink neon border */}
          <View style={{ backgroundColor: '#EE10CC', borderRadius: 13, padding: 5 }}>
            {/* Deep-blue fill */}
            <View
              style={{
                backgroundColor: '#2233BB',
                borderRadius: 9,
                paddingVertical: 14,
                paddingHorizontal: 12,
                overflow: 'hidden',
              }}
            >
              {/* Top-left gloss shine */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 90,
                  height: 24,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  borderBottomRightRadius: 50,
                  borderTopLeftRadius: 9,
                }}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <SparkleCluster side="left" />
                <Text
                  style={{
                    flex: 1,
                    color: '#FFFFFF',
                    fontFamily: 'VT323_400Regular',
                    fontSize: 40,
                    textAlign: 'center',
                    letterSpacing: 3,
                    textShadowColor: '#000866',
                    textShadowOffset: { width: 3, height: 3 },
                    textShadowRadius: 0,
                  }}
                >
                  LETS GO
                </Text>
                <SparkleCluster side="right" />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};
