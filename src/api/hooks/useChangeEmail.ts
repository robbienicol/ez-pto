import { useCallback, useMemo, useState } from 'react';
import { gql } from 'graphql-request';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-expo';
import type { EmailAddressResource, UserResource } from '@clerk/types';

import { createGraphqlClient } from '@src/api/client/graphqlClient';
import { useAuth } from '@src/state/auth/AuthProvider';

export interface DbUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
}

interface ChangeEmailInDbResponse {
  changeEmailInDb: DbUser;
}

interface ChangeEmailInDbVariables {
  newEmail: string;
}

const CHANGE_EMAIL_IN_DB = gql`
  mutation ChangeEmailInDb($newEmail: String!) {
    changeEmailInDb(newEmail: $newEmail) {
      id
      clerkId
      email
      name
    }
  }
`;

export function meQueryKey() {
  return ['ME'] as const;
}

function normalizeEmail(email: string): string {
  return email.trim();
}

export function useChangeEmail() {
  const { user, isLoaded } = useUser();
  const clerkUser: UserResource | null = user ?? null;

  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['ME', userId ?? ''] as const, [userId]);

  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  const pendingEmailVerification = emailAddressId !== null;

  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;

  const sendCodeMutation = useMutation({
    mutationKey: ['SEND_EMAIL_CHANGE_CODE', userId ?? ''],
    mutationFn: async (rawEmail: string) => {
      const newEmail = normalizeEmail(rawEmail);
      if (!newEmail) throw new Error('Email address is required.');
      if (!clerkUser) throw new Error('Not signed in.');

      const created = await clerkUser.createEmailAddress({ email: newEmail });
      await created.prepareVerification({ strategy: 'email_code' });
      return created.id;
    },
    onSuccess: (id) => {
      setEmailAddressId(id);
    },
  });

  const verifyAndPersistMutation = useMutation({
    mutationKey: ['VERIFY_EMAIL_CHANGE_CODE', userId ?? ''],
    mutationFn: async (args: { newEmail: string; code: string }) => {
      const newEmail = normalizeEmail(args.newEmail);
      const code = args.code.trim();

      if (!newEmail) throw new Error('Email address is required.');
      if (!code) throw new Error('Verification code is required.');
      if (!emailAddressId) throw new Error('No pending email verification.');
      if (!clerkUser) throw new Error('Not signed in.');

      const emailAddress: EmailAddressResource | null =
        clerkUser.emailAddresses.find((e) => e.id === emailAddressId) ?? null;
      if (!emailAddress) throw new Error('Could not find that email address on your account.');

      await emailAddress.attemptVerification({ code });
      await clerkUser.update({ primaryEmailAddressId: emailAddressId });

      const accessToken = await getToken();
      if (!accessToken) throw new Error('Not signed in.');

      const client = createGraphqlClient({ accessToken });
      const data = await client.request<ChangeEmailInDbResponse, ChangeEmailInDbVariables>(
        CHANGE_EMAIL_IN_DB,
        { newEmail },
      );

      return data.changeEmailInDb;
    },

    onSuccess: async () => {
      setEmailAddressId(null);
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const reset = useCallback(() => {
    sendCodeMutation.reset();
    verifyAndPersistMutation.reset();
  }, [sendCodeMutation, verifyAndPersistMutation]);

  const clearPendingVerification = useCallback(() => {
    setEmailAddressId(null);
    verifyAndPersistMutation.reset();
  }, [verifyAndPersistMutation]);

  const error = useMemo(() => {
    const err = sendCodeMutation.error ?? verifyAndPersistMutation.error;
    if (!err) return null;
    return err instanceof Error ? err.message : String(err);
  }, [sendCodeMutation.error, verifyAndPersistMutation.error]);

  const deleteAccount = useCallback(async () => {
    if (!clerkUser) throw new Error('Not signed in.');
    await clerkUser.delete();
  }, [clerkUser]);

  return {
    isLoaded,
    primaryEmail,
    pendingEmailVerification,

    sendEmailCode: sendCodeMutation.mutateAsync,
    verifyEmailCodeAndPersist: verifyAndPersistMutation.mutateAsync,
    deleteAccount,

    isSendingEmailCode: sendCodeMutation.isPending,
    isVerifyingEmailCode: verifyAndPersistMutation.isPending,

    error,
    reset,
    clearPendingVerification,
  };
}

