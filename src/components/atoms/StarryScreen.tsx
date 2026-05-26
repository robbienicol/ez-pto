import React from 'react';

import { cn } from '@src/utils/cn';
import { ThemedView } from './ThemedView';
import { StarryBackground } from './StarryBackground';

interface StarryScreenProps {
  children: React.ReactNode;
  className?: string;
}

export const StarryScreen: React.FC<StarryScreenProps> = ({ children, className }) => (
  <ThemedView className={cn('flex-1', className)}>
    <StarryBackground />
    {children}
  </ThemedView>
);
