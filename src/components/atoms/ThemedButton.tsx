import React, { useCallback, useMemo } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { cn } from '@src/utils/cn';
import { ThemedText } from '@src/components/atoms/ThemedText';

export type ThemedButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ThemedButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ThemedButtonVariant;
}

const containerClassName: Record<ThemedButtonVariant, string> = {
  primary: 'bg-primary dark:bg-primaryDark',
  secondary: 'bg-success/10 dark:bg-successDark/10 border border-success/30 dark:border-successDark/30',
  ghost: 'bg-transparent',
};

const labelTone: Record<ThemedButtonVariant, Parameters<typeof ThemedText>[0]['tone']> = {
  primary: 'default',
  secondary: 'success',
  ghost: 'primary',
};

const labelClassName: Record<ThemedButtonVariant, string> = {
  primary: 'text-white',
  secondary: '',
  ghost: '',
};

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  label,
  variant = 'primary',
  disabled,
  onPress,
  className,
  ...props
}) => {
  const mergedClassName = useMemo(
    () =>
      cn(
        'px-4 py-3 rounded-pill items-center justify-center active:opacity-90',
        containerClassName[variant],
        disabled ? 'opacity-50' : '',
        className,
      ),
    [className, disabled, variant],
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
      <ThemedText variant="headline" tone={labelTone[variant]} className={labelClassName[variant]}>
        {label}
      </ThemedText>
    </Pressable>
  );
};

