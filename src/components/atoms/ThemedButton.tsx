import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@src/utils/cn';
import { ThemedText } from '@src/components/atoms/ThemedText';

export type ThemedButtonVariant = 'primary' | 'secondary' | 'ghost' | 'primary-green';

interface ThemedButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ThemedButtonVariant;
  showSelectionCursor?: boolean;
}

const CURSOR_PIXEL = 2;
const CURSOR_PATTERN = [
  [0, 1],
  [1, 1],
  [1, 1],
  [0, 1],
] as const;

function SelectionCursor() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 650 }),
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: 650 }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animatedStyle} className="mr-2">
      <View className="gap-0" style={{ transform: [{ scaleX: -1 }] }}>
        {CURSOR_PATTERN.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row">
            {row.map((on, colIndex) => (
              <View
                key={colIndex}
                style={{
                  width: CURSOR_PIXEL,
                  height: CURSOR_PIXEL,
                  backgroundColor: on ? '#FFFFFF' : 'transparent',
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const containerClassName: Record<ThemedButtonVariant, string> = {
  primary: 'bg-primary dark:bg-primaryDark border border-white',
  secondary: 'bg-neonPurple/15 dark:bg-neonPurple/20 border border-neonPurple/40',
  ghost: 'bg-transparent',
  'primary-green': 'bg-laserGreen border border-white',
};

const labelTone: Record<ThemedButtonVariant, Parameters<typeof ThemedText>[0]['tone']> = {
  primary: 'default',
  secondary: 'primary',
  ghost: 'primary',
  'primary-green': 'default',
};

const labelClassName: Record<ThemedButtonVariant, string> = {
  primary: 'text-white font-nunito-extrabold',
  secondary: 'font-nunito-bold',
  ghost: 'font-nunito-semibold',
  'primary-green': 'text-white font-nunito-extrabold',
};

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  label,
  variant = 'primary',
  showSelectionCursor = false,
  disabled,
  onPress,
  className,
  ...props
}) => {
  const mergedClassName = useMemo(
    () =>
      cn(
        'px-4 py-3 items-center justify-center active:opacity-90',
        showSelectionCursor ? 'flex-row' : '',
        containerClassName[variant],
        disabled ? 'opacity-50' : '',
        className,
      ),
    [className, disabled, showSelectionCursor, variant],
  );

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      onPress?.(event);
    },
    [onPress],
  );

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPress={handlePress}
      className={mergedClassName}
      accessibilityRole="button"
    >
      {showSelectionCursor ? <SelectionCursor /> : null}
      <ThemedText variant="headline" tone={labelTone[variant]} className={labelClassName[variant]}>
        {label}
      </ThemedText>
    </Pressable>
  );
};

