import React, { useMemo } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@src/utils/cn';

interface ThemedViewProps extends ViewProps {
  className?: string;
}

export const ThemedView: React.FC<ThemedViewProps> = ({ className, ...props }) => {
  const mergedClassName = useMemo(
    () => cn('bg-background dark:bg-backgroundDark', className),
    [className],
  );

  return <View {...props} className={mergedClassName} />;
};

