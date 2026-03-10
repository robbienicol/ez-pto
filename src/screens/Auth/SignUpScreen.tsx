import React, { useCallback, useState } from 'react';
import { SafeAreaView, TextInput, View, ActivityIndicator } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import type { AuthStackParamList } from '@src/navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp, isLoaded } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      navigation.navigate('VerifyEmail', { emailAddress: email });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isLoaded, navigation, password, signUp]);

  const handleGoToSignIn = useCallback(() => {
    navigation.navigate('SignIn');
  }, [navigation]);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-12 pb-10 gap-6">
          <View className="gap-1">
            <ThemedText variant="title">Create account</ThemedText>
            <ThemedText variant="body" tone="muted">Start planning your next escape</ThemedText>
          </View>

          <View className="gap-4">
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-xl px-4 py-3 text-foreground dark:text-foregroundDark font-nunito"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              secureTextEntry
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-xl px-4 py-3 text-foreground dark:text-foregroundDark font-nunito"
              placeholderTextColor="#9ca3af"
            />

            {error && (
              <ThemedText variant="caption" tone="danger">{error}</ThemedText>
            )}

            {isSubmitting ? (
              <ActivityIndicator />
            ) : (
              <ThemedButton label="Create account" variant="primary" onPress={handleSignUp} />
            )}
          </View>

          <View className="flex-row justify-center gap-1">
            <ThemedText variant="body" tone="muted">Already have an account?</ThemedText>
            <ThemedButton label="Sign in" variant="ghost" onPress={handleGoToSignIn} />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};
