import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useIAP } from '@src/api/hooks/useIAP';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Paywall'>;

const INCLUDED = [
  { emoji: '🎵', label: 'Music identity breakdown', detail: 'What your taste and personality say about who you are — and who you\'re becoming' },
  { emoji: '🔭', label: 'Genres & artists to explore', detail: 'A specific direction to push your sound forward, not just what you already know' },
  { emoji: '▶', label: '3 curated Spotify playlists', detail: 'Built for your sound and personality, not just a mood' },
  { emoji: '→', label: 'How to evolve your taste', detail: 'One actionable step to go deeper into the music that fits who you are' },
];

export const PaywallScreen: React.FC<Props> = ({ navigation, route }) => {
  const { answers } = route.params;
  const { isPurchased, isPurchasing, isRestoring, purchase, restore } = useIAP();

  const handlePurchase = useCallback(async () => {
    await purchase();
  }, [purchase]);

  React.useEffect(() => {
    if (isPurchased) {
      navigation.replace('FullReport', { answers });
    }
  }, [isPurchased, navigation, answers]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#04001A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 20, paddingBottom: 48, gap: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable onPress={handleBack} hitSlop={12} style={{ alignSelf: 'flex-start' }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>← Back</Text>
          </Pressable>

          {/* Header */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 3 }}>
              UNLOCK YOUR FULL REPORT
            </Text>
            <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 28, color: '#FFFFFF', lineHeight: 36 }}>
              See what your personality says about your music.
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 22 }}>
              Your archetype is just the start. The full report tells you exactly what to listen to and where to take your taste next.
            </Text>
          </View>

          {/* What's included */}
          <View style={{ gap: 4 }}>
            {INCLUDED.map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  gap: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.07)',
                  alignItems: 'flex-start',
                }}
              >
                <Text style={{ fontSize: 20, marginTop: 1 }}>{item.emoji}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 }}>
                    {item.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Price + CTA */}
          <View style={{ gap: 14, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 42, color: '#FFFFFF' }}>$7.99</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>one time</Text>
            </View>

            <Pressable
              onPress={handlePurchase}
              disabled={isPurchasing}
              style={({ pressed }) => ({
                width: '100%',
                backgroundColor: pressed ? '#CC3D99' : '#FF4DB3',
                paddingVertical: 17,
                borderRadius: 14,
                alignItems: 'center',
                opacity: isPurchasing ? 0.7 : 1,
              })}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: '#FFFFFF' }}>
                  Unlock full report
                </Text>
              )}
            </Pressable>

            <Pressable onPress={restore} disabled={isRestoring} style={{ paddingVertical: 8 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                {isRestoring ? 'Restoring...' : 'Restore previous purchase'}
              </Text>
            </Pressable>
          </View>

          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 20 }}>
            Payment processed by Apple. No subscription. No recurring charges.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
