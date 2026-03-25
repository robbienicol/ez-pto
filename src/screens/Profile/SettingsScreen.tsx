import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useChangeEmail } from '@src/api/hooks/useChangeEmail';
import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import { useAuth } from '@src/state/auth/AuthProvider';
import type { ProfileStackParamList } from '@src/navigation/ProfileNavigator';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();
  const {
    isLoaded,
    primaryEmail,
    pendingEmailVerification,
    sendEmailCode,
    verifyEmailCodeAndPersist,
    deleteAccount,
    isSendingEmailCode,
    isVerifyingEmailCode,
    error: emailError,
    reset: resetEmailChange,
  } = useChangeEmail();

  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isSubmitting || isSendingEmailCode || isVerifyingEmailCode;

  const canSendCode = useMemo(() => newEmail.trim().length > 3 && !isBusy, [isBusy, newEmail]);
  const canVerifyCode = useMemo(
    () => pendingEmailVerification && emailCode.trim().length > 0 && !isBusy,
    [emailCode, isBusy, pendingEmailVerification],
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSignOut = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signOut();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [signOut]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            setError(null);
            try {
              await deleteAccount();
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Something went wrong.';
              setError(message);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [deleteAccount]);

  const handleSendEmailCode = useCallback(async () => {
    setError(null);
    resetEmailChange();
    try {
      await sendEmailCode(newEmail);
    } catch {
      // React Query mutation retains the error; screen shows `emailError`.
    }
  }, [newEmail, resetEmailChange, sendEmailCode]);

  const handleVerifyEmailCode = useCallback(async () => {
    setError(null);
    resetEmailChange();
    try {
      await verifyEmailCodeAndPersist({ newEmail, code: emailCode });
      setEmailCode('');
      setNewEmail('');
    } catch {
      // React Query mutation retains the error; screen shows `emailError`.
    }
  }, [emailCode, newEmail, resetEmailChange, verifyEmailCodeAndPersist]);

  if (!isLoaded) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-background dark:bg-backgroundDark">
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 gap-6">
          <View className="flex-row items-center justify-between">
            <ThemedButton label="Back" variant="ghost" onPress={handleBack} />
            <ThemedText variant="headline">Settings</ThemedText>
            <View style={{ width: 72 }} />
          </View>

          {error && (
            <ThemedText variant="caption" tone="danger">
              {error}
            </ThemedText>
          )}
          {!error && emailError && (
            <ThemedText variant="caption" tone="danger">
              {emailError}
            </ThemedText>
          )}

          <View className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4 gap-3">
            <ThemedText variant="headline">Email</ThemedText>
            <ThemedText variant="caption" tone="muted">
              Current: {primaryEmail ?? '—'}
            </ThemedText>

            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="New email address"
              value={newEmail}
              onChangeText={setNewEmail}
              className="bg-background dark:bg-backgroundDark border border-border dark:border-borderDark rounded-xl px-4 py-3 text-foreground dark:text-foregroundDark font-nunito"
              placeholderTextColor="#9ca3af"
            />

            <ThemedButton
              label={pendingEmailVerification ? 'Resend code' : 'Send verification code'}
              variant="secondary"
              disabled={!canSendCode}
              onPress={handleSendEmailCode}
            />

            {pendingEmailVerification && (
              <View className="gap-3">
                <TextInput
                  keyboardType="number-pad"
                  placeholder="Verification code"
                  value={emailCode}
                  onChangeText={setEmailCode}
                  className="bg-background dark:bg-backgroundDark border border-border dark:border-borderDark rounded-xl px-4 py-3 text-foreground dark:text-foregroundDark font-nunito"
                  placeholderTextColor="#9ca3af"
                />
                <ThemedButton
                  label="Verify & set as primary"
                  variant="primary"
                  disabled={!canVerifyCode}
                  onPress={handleVerifyEmailCode}
                />
              </View>
            )}
          </View>

          <View className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4 gap-3">
            <ThemedText variant="headline">Account</ThemedText>
            <ThemedButton label="Sign out" variant="ghost" disabled={isBusy} onPress={handleSignOut} />
            <ThemedButton
              label="Delete account"
              variant="secondary"
              disabled={isBusy}
              onPress={handleDeleteAccount}
            />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

