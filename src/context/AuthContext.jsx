import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  useAuthCompat as useClerkAuth,
  useClerkCompat as useClerk,
  useUserCompat as useUser,
} from '../lib/clerkCompat';
import { BASE_URL, syncCurrentUserProfileFromClerk } from '../services/apiClient';
import {
  clearLoggedInUser,
  getDefaultRouteForUser,
  getLoggedInUser,
  setLoggedInUser,
} from '../utils/authStorage';
import { normalizeProfilePreferences } from '../utils/profilePreferences';

const AuthContext = createContext(null);

function normalizeRole(role) {
  const normalized = String(role || '')
    .trim()
    .toLowerCase();
  if (normalized === 'super_admin') {
    return 'super_admin';
  }
  if (
    ['institute', 'institute_admin', 'institution_admin', 'instructor'].includes(
      normalized
    )
  ) {
    return 'institute';
  }
  return 'student';
}

function fallbackNameFromEmail(email) {
  const value = String(email || '').trim();
  if (!value) {
    return 'Learner';
  }

  const local = value.split('@')[0]?.trim();
  return local || 'Learner';
}

function toAbsoluteImageUrl(imagePath) {
  if (!imagePath) {
    return '';
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  return `${BASE_URL}${imagePath}`;
}

function buildClerkDisplayName(clerkUser) {
  if (!clerkUser) {
    return 'Learner';
  }

  const directName = clerkUser.fullName?.trim();
  if (directName) {
    return directName;
  }

  const fallback = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim();
  return fallback || fallbackNameFromEmail(clerkUser.primaryEmailAddress?.emailAddress);
}

function buildClerkSnapshot(clerkUser) {
  if (!clerkUser) {
    return null;
  }

  return {
    id: null,
    clerkId: clerkUser.id,
    name: buildClerkDisplayName(clerkUser),
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    role: normalizeRole(clerkUser.publicMetadata?.role),
    backendRole: clerkUser.publicMetadata?.role || null,
    instituteCode: null,
    profile_image: toAbsoluteImageUrl(clerkUser.imageUrl || ''),
    bio: '',
    preferences: normalizeProfilePreferences(null),
  };
}

function mergeSyncedUser(clerkSnapshot, backendPayload) {
  if (!clerkSnapshot) {
    return null;
  }

  const backendUser = backendPayload?.user || null;
  const preferences = normalizeProfilePreferences(backendPayload?.preferences);

  return {
    ...clerkSnapshot,
    id: backendUser?.id ?? clerkSnapshot.id,
    name: backendUser?.name || clerkSnapshot.name,
    email: backendUser?.email || clerkSnapshot.email,
    role: normalizeRole(backendUser?.role || clerkSnapshot.role),
    backendRole: backendUser?.role || clerkSnapshot.backendRole || null,
    instituteCode: backendUser?.instituteCode || clerkSnapshot.instituteCode,
    bio: backendUser?.bio || clerkSnapshot.bio || '',
    profile_image: toAbsoluteImageUrl(
      backendUser?.profileImage || backendUser?.profile_image || clerkSnapshot.profile_image || ''
    ),
    preferences,
  };
}

function AuthProvider({ children }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [user, setUser] = useState(() => getLoggedInUser());
  const [isSyncing, setIsSyncing] = useState(false);

  const syncUserState = useCallback(async () => {
    if (!isSignedIn || !clerkUser) {
      clearLoggedInUser();
      setUser(null);
      return;
    }

    // First hydrate UI from Clerk so name/avatar are instantly dynamic from Google profile.
    const clerkSnapshot = buildClerkSnapshot(clerkUser);
    setUser(clerkSnapshot);
    setLoggedInUser(clerkSnapshot);

    // Then sync with backend to obtain local DB id used by existing analytics endpoints.
    setIsSyncing(true);
    try {
      const response = await syncCurrentUserProfileFromClerk();
      const mergedUser = mergeSyncedUser(clerkSnapshot, response);
      setUser(mergedUser);
      setLoggedInUser(mergedUser);
    } catch {
      // Keep Clerk-derived data even if backend sync temporarily fails.
      setUser(clerkSnapshot);
      setLoggedInUser(clerkSnapshot);
    } finally {
      setIsSyncing(false);
    }
  }, [isSignedIn, clerkUser]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    void syncUserState();
  }, [isLoaded, syncUserState]);

  const value = useMemo(
    () => ({
      user,
      role: user ? normalizeRole(user?.role) : null,
      isAuthenticated: Boolean(isSignedIn && user),
      isAuthLoading: !isLoaded || isSyncing,
      loginUser(nextUser) {
        const normalized = {
          ...nextUser,
          profile_image: toAbsoluteImageUrl(nextUser?.profile_image || ''),
          preferences: normalizeProfilePreferences(nextUser?.preferences),
        };
        setLoggedInUser(normalized);
        setUser(normalized);
      },
      applyUserPatch(patch) {
        setUser((current) => {
          if (!current) {
            return current;
          }

          const next = {
            ...current,
            ...patch,
            profile_image: toAbsoluteImageUrl(
              patch?.profile_image == null ? current.profile_image : patch.profile_image
            ),
            preferences: normalizeProfilePreferences({
              ...(current.preferences || {}),
              ...(patch?.preferences || {}),
            }),
          };

          setLoggedInUser(next);
          return next;
        });
      },
      async logoutUser() {
        clearLoggedInUser();
        setUser(null);
        await signOut({ redirectUrl: '/login' });
      },
      async refreshUser() {
        await syncUserState();
      },
      getDefaultRoute() {
        return getDefaultRouteForUser(user);
      },
    }),
    [user, isSignedIn, isLoaded, isSyncing, signOut, syncUserState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
