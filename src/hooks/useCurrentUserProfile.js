import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';
import { normalizeProfilePreferences } from '../utils/profilePreferences';

export function useCurrentUserProfile() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, applyUserPatch } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.currentUserProfile(user?.id),
    queryFn: getCurrentUserProfile,
    enabled: Boolean(isAuthenticated && user?.id),
    staleTime: QUERY_STALE_TIMES.profile,
  });

  const mutation = useMutation({
    mutationFn: (payload) => updateCurrentUserProfile(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.currentUserProfile(user?.id), response);

      const responseUser = response?.user || null;
      const responsePreferences = normalizeProfilePreferences(response?.preferences);

      if (responseUser || response?.preferences) {
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
      }
    },
  });

  const profile = query.data?.user || null;
  const stats = query.data?.stats || null;
  const preferences = useMemo(
    () => normalizeProfilePreferences(query.data?.preferences || user?.preferences),
    [query.data?.preferences, user?.preferences]
  );

  const updateProfile = useCallback((payload) => mutation.mutateAsync(payload), [mutation]);

  return {
    profile,
    preferences,
    stats,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    updateProfile,
    isSaving: mutation.isPending,
  };
}
