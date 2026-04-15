import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuthCompat as useClerkAuth } from '../lib/clerkCompat';
import { updateCurrentUserProfile } from '../services/apiClient';
import { queryKeys } from '../services/queryConfig';
import { normalizeProfilePreferences } from '../utils/profilePreferences';

export function useDebouncedPreferenceSave(delayMs = 600) {
  const { isLoaded: isClerkLoaded, isSignedIn, getToken } = useClerkAuth();
  const queryClient = useQueryClient();
  const { user, applyUserPatch } = useAuth();
  const timeoutRef = useRef(null);
  const pendingPatchRef = useRef({});

  const mutation = useMutation({
    mutationFn: async (preferencesPatch) => {
      if (!isClerkLoaded || !isSignedIn) {
        return null;
      }

      const token = await getToken();
      if (!token) {
        return null;
      }

      return updateCurrentUserProfile(
        {
          preferences: preferencesPatch,
        },
        token
      );
    },
    onSuccess: (response) => {
      if (!response) {
        return;
      }

      queryClient.setQueryData(queryKeys.currentUserProfile(user?.id), response);

      const responseUser = response?.user || null;
      const responsePreferences = normalizeProfilePreferences(response?.preferences);

      applyUserPatch({
        ...(responseUser
          ? {
              name: responseUser.name,
              email: responseUser.email,
              bio: responseUser.bio,
              profile_image: responseUser.profile_image,
            }
          : {}),
        preferences: responsePreferences,
      });
    },
  });

  const flushPreferencePatch = useCallback(async () => {
    const pendingPatch = pendingPatchRef.current;
    if (
      !isClerkLoaded ||
      !isSignedIn ||
      !user?.id ||
      !pendingPatch ||
      !Object.keys(pendingPatch).length
    ) {
      return;
    }

    pendingPatchRef.current = {};
    await mutation.mutateAsync(pendingPatch);
  }, [isClerkLoaded, isSignedIn, mutation, user?.id]);

  const queuePreferencePatch = useCallback(
    (patch) => {
      if (!isClerkLoaded || !isSignedIn || !user?.id || !patch || typeof patch !== 'object') {
        return;
      }

      pendingPatchRef.current = {
        ...pendingPatchRef.current,
        ...patch,
      };

      applyUserPatch({
        preferences: patch,
      });

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        void flushPreferencePatch();
      }, delayMs);
    },
    [applyUserPatch, delayMs, flushPreferencePatch, isClerkLoaded, isSignedIn, user?.id]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    queuePreferencePatch,
    flushPreferencePatch,
    isSaving: mutation.isPending,
  };
}
