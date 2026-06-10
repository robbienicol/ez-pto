import React, { useCallback } from 'react';
import { Pressable, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AppStackParamList, ReportType } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'ChooseReport'>;

interface ReportOption {
  type: ReportType;
  emoji: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    type: 'music',
    emoji: '🎵',
    title: 'Your sound',
    tagline: 'MUSIC IDENTITY',
    description: 'Discover the music personality you should be leaning into — genres, artists, and how to evolve your taste',
    accent: '#BF5FFF',
  },
  {
    type: 'style',
    emoji: '👔',
    title: 'Your look',
    tagline: 'STYLE GUIDE',
    description: 'The exact aesthetic direction you should be dressing toward and the specific pieces to own',
    accent: '#FF4DB3',
  },
  {
    type: 'haircut',
    emoji: '✂️',
    title: 'Your cut',
    tagline: 'PERFECT HAIRCUT',
    description: 'The haircut built for your face, your vibe, and your lifestyle — plus exactly what to tell your barber',
    accent: '#FFD700',
  },
];

export const ChooseReportScreen: React.FC<Props> = ({ navigation, route }) => {
  const { answers } = route.params;

  const handleSelect = useCallback((reportType: ReportType) => {
    navigation.navigate('Personality', { answers, reportType });
  }, [navigation, answers]);

  return (
    <View style={{ flex: 1, backgroundColor: '#04001A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ gap: 6, marginBottom: 8 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: 3 }}>
              QUIZ COMPLETE
            </Text>
            <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 28, color: '#FFFFFF', lineHeight: 36 }}>
              What do you want{'\n'}to unlock?
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 22 }}>
              Pick one. We'll build your full report around it.
            </Text>
          </View>

          {/* Option cards */}
          {REPORT_OPTIONS.map(option => (
            <Pressable
              key={option.type}
              onPress={() => handleSelect(option.type)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                borderWidth: 2,
                borderColor: pressed ? option.accent : option.accent + '55',
                borderRadius: 20,
                backgroundColor: pressed ? option.accent + '18' : option.accent + '0A',
                padding: 24,
                gap: 12,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 32 }}>{option.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: option.accent, letterSpacing: 3 }}>
                    {option.tagline}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#FFFFFF' }}>
                    {option.title}
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 22, color: option.accent }}>→</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 20 }}>
                {option.description}
              </Text>
            </Pressable>
          ))}

          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8 }}>
            You can always come back and try the others
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
