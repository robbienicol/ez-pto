import { Ionicons } from '@expo/vector-icons';
import type React from 'react';

import type { AudioFormat, ContentTone, LiveRadioStyle } from '@src/api/hooks/useCreateAudio';

export type WizardStep = 1 | 2 | 3 | 4;
export type PodcastLength = 5 | 15 | 30 | 60;
export type Phase = 'wizard' | 'generating' | 'success' | 'error';

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type { AudioFormat, ContentTone, LiveRadioStyle };
