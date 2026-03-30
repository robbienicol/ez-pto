import type { LiveRadioStyle } from '@src/api/hooks/useCreateAudio';

import { LIVE_RADIO_OTHER_STYLES } from './wizardConstants';

export function buildAudioGenerateConfirmBody(params: {
  topic: string;
  formatLabel: string;
  toneLabel?: string;
  lengthLabel?: string;
  radioStyleLabel?: string;
}): string {
  const lines = [`Topic: ${params.topic.trim()}`, `Format: ${params.formatLabel}`];
  if (params.toneLabel) lines.push(`How it sounds: ${params.toneLabel}`);
  if (params.lengthLabel) lines.push(`Length: ${params.lengthLabel}`);
  if (params.radioStyleLabel) lines.push(`Live radio style: ${params.radioStyleLabel}`);
  lines.push('', 'Are you sure you want to generate this audio?');
  return lines.join('\n');
}

export function liveRadioStyleLabel(style: LiveRadioStyle): string {
  if (style === 'sports') {
    return 'Sports radio';
  }
  const o = LIVE_RADIO_OTHER_STYLES.find((x) => x.value === style);
  return o?.label ?? style;
}
