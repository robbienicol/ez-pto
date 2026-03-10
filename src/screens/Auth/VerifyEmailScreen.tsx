import React, { useCallback, useState } from 'react';
import { SafeAreaView, TextInput, View, ActivityIndicator } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import type { AuthStackParamList } from '@src/navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export const VerifyEmailScreen: React.FC<Props> = ({ route }) => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { emailAddress } = route.params;

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = useCallback(async () => {
    if (!isLoaded) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [code, isLoaded, setActive, signUp]);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-12 pb-10 gap-6">
          <View className="gap-1">
            <ThemedText variant="title">Check your email</ThemedText>
            <ThemedText variant="body" tone="muted">
              We sent a code to {emailAddress}
            </ThemedText>
          </View>

          <View className="gap-4">
            <TextInput
              keyboardType="number-pad"
              placeholder="Verification code"
              value={code}
              onChangeText={setCode}
              className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-xl px-4 py-3 text-foreground dark:text-foregroundDark font-nunito"
              placeholderTextColor="#9ca3af"
            />

            {error && (
              <ThemedText variant="caption" tone="danger">{error}</ThemedText>
            )}

            {isSubmitting ? (
              <ActivityIndicator />
            ) : (
              <ThemedButton label="Verify" variant="primary" onPress={handleVerify} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};
