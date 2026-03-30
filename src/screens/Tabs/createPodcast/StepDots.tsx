import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { WizardStep } from './types';

interface StepDotsProps {
  current: WizardStep;
  total: number;
}

export const StepDots: React.FC<StepDotsProps> = ({ current, total }) => {
  const indices = useMemo(
    () => Array.from({ length: total }, (_, i) => (i + 1) as WizardStep),
    [total],
  );
  return (
    <View className="flex-row items-center justify-center gap-2">
      {indices.map((s) => (
        <View
          key={s}
          className={`rounded-full ${
            s === current
              ? 'w-6 h-2 bg-primary dark:bg-primaryDark'
              : s < current
                ? 'w-2 h-2 bg-primary/40 dark:bg-primaryDark/40'
                : 'w-2 h-2 bg-border dark:bg-borderDark'
          }`}
        />
      ))}
    </View>
  );
};
