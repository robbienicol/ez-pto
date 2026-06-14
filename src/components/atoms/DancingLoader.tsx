import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarryScreen } from '@src/components/atoms/StarryScreen';

const CORNER_GIFS = [
  { source: require('../../../assets/kirby-dancing.gif'),  position: { top: 24,    left: 24   } },
  { source: require('../../../assets/lisa-dancing.gif'),   position: { top: 24,    right: 24  } },
  { source: require('../../../assets/dance-peanuts.gif'),  position: { bottom: 24, left: 24   } },
  { source: require('../../../assets/arnold-dancing.gif'), position: { bottom: 24, right: 24  } },
] as const;

interface Props {
  title?: string;
  subtitle?: string;
}

export function DancingLoader({ title = 'Reading your vibe...', subtitle = 'Building your music identity' }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % CORNER_GIFS.length), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <StarryScreen className="flex-1">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, width: '100%' }}>
          {CORNER_GIFS.map((gif, i) => (
            <Image
              key={i}
              source={gif.source}
              style={{ position: 'absolute', width: 80, height: 80, opacity: active === i ? 1 : 0, ...gif.position }}
              contentFit="contain"
            />
          ))}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#BF5FFF', textAlign: 'center' }}>
              {title}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              {subtitle}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </StarryScreen>
  );
}
