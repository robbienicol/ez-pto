import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, TextInput, View } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import { useAuth } from '@src/state/auth/AuthProvider';
import type { ProfileStackParamList } from '@src/navigation/ProfileNavigator';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

type EmailAddressLike = {
  id: string;
  prepareVerification?: (args: { strategy: 'email_code' }) => Promise<unknown>;
  attemptVerification?: (args: { code: string }) => Promise<unknown>;
};

type UserLike = {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: EmailAddressLike[];
  createEmailAddress?: (args: { emailAddress: string }) => Promise<EmailAddressLike>;
  update?: (args: { primaryEmailAddressId: string }) => Promise<unknown>;
  delete: () => Promise<unknown>;
};

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();
  const userLike: UserLike | null = (user as unknown as UserLike | null) ?? null;

  const primaryEmail = userLike?.primaryEmailAddress?.emailAddress ?? null;

  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSendCode = useMemo(() => newEmail.trim().length > 3 && !isSubmitting, [isSubmitting, newEmail]);
  const canVerifyCode = useMemo(
    () => pendingEmailVerification && emailCode.trim().length > 0 && !isSubmitting,
    [emailCode, isSubmitting, pendingEmailVerification],
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
    if (!userLike) return;

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
              await userLike.delete();
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
  }, [userLike]);

  const handleSendEmailCode = useCallback(async () => {
    if (!userLike?.createEmailAddress) {
      setError('Email changes are not available yet.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await userLike.createEmailAddress({ emailAddress: newEmail.trim() });
      await created.prepareVerification?.({ strategy: 'email_code' });

      setEmailAddressId(created.id);
      setPendingEmailVerification(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [newEmail, userLike]);

  const handleVerifyEmailCode = useCallback(async () => {
    if (!userLike || !emailAddressId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const emailAddress = userLike.emailAddresses?.find((e) => e.id === emailAddressId) ?? null;

      if (!emailAddress) {
        setError('Could not find that email address on your account.');
        return;
      }

      await emailAddress.attemptVerification?.({ code: emailCode.trim() });
      await userLike.update?.({ primaryEmailAddressId: emailAddressId });

      setPendingEmailVerification(false);
      setEmailCode('');
      setNewEmail('');
      setEmailAddressId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [emailAddressId, emailCode, userLike]);

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
            <ThemedButton label="Sign out" variant="ghost" disabled={isSubmitting} onPress={handleSignOut} />
            <ThemedButton
              label="Delete account"
              variant="secondary"
              disabled={isSubmitting || !userLike}
              onPress={handleDeleteAccount}
            />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

