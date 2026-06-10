import React, { useMemo } from 'react';
import { Text, type TextProps } from 'react-native';

import { cn } from '@src/utils/cn';

export type ThemedTextVariant = 'display' | 'title' | 'headline' | 'body' | 'caption';
export type ThemedTextTone = 'default' | 'muted' | 'primary' | 'success' | 'danger';

interface ThemedTextProps extends TextProps {
  variant?: ThemedTextVariant;
  tone?: ThemedTextTone;
  className?: string;
}

const variantClassName: Record<ThemedTextVariant, string> = {
  display: 'text-display font-nunito-extrabold',
  title: 'text-title font-nunito-bold',
  headline: 'text-headline font-nunito-semibold',
  body: 'text-body font-nunito',
  caption: 'text-caption font-nunito',
};

const toneClassName: Record<ThemedTextTone, string> = {
  default: 'text-foreground dark:text-foregroundDark',
  muted: 'text-muted dark:text-mutedDark',
  primary: 'text-primary dark:text-primaryDark',
  success: 'text-success dark:text-successDark',
  danger: 'text-danger dark:text-dangerDark',
};

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'body',
  tone = 'default',
  className,
  ...props
}) => {
  const mergedClassName = useMemo(
    () => cn(variantClassName[variant], toneClassName[tone], className),
    [className, tone, variant],
  );

  return <Text {...props} className={mergedClassName} />;
};

