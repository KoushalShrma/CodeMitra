import {
  ClerkProvider,
  RedirectToSignIn,
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  useAuth,
  useClerk,
  useUser,
} from '@clerk/clerk-react';
import { Link, Navigate } from 'react-router-dom';

const clerkKey = String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
const clerkFlag = String(import.meta.env.VITE_ENABLE_CLERK_AUTH || '').trim().toLowerCase();

const isFlagDisabled = ['0', 'false', 'off', 'no'].includes(clerkFlag);
export const isClerkEnabled = !isFlagDisabled && clerkKey.length > 0;

function DemoAuthNotice({ title }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 text-sm text-brand-muted">
      <p className="font-semibold text-brand-text">{title}</p>
      <p className="mt-2">
        Clerk auth is disabled in this Docker image for zero-config startup.
      </p>
      <p className="mt-2">
        Use institution login for demo usage:
      </p>
      <Link to="/institution/login" className="ui-button ui-button-primary mt-3 inline-flex">
        Go to Institution Login
      </Link>
    </div>
  );
}

export function ClerkProviderCompat({ children }) {
  if (!isClerkEnabled) {
    return children;
  }

  return <ClerkProvider publishableKey={clerkKey}>{children}</ClerkProvider>;
}

export function SignedInCompat({ children }) {
  if (!isClerkEnabled) {
    return null;
  }

  return <SignedIn>{children}</SignedIn>;
}

export function SignedOutCompat({ children }) {
  if (!isClerkEnabled) {
    return children;
  }

  return <SignedOut>{children}</SignedOut>;
}

export function RedirectToSignInCompat() {
  if (!isClerkEnabled) {
    return <Navigate to="/institution/login" replace />;
  }

  return <RedirectToSignIn />;
}

export function SignInCompat(props) {
  if (!isClerkEnabled) {
    return <DemoAuthNotice title="Student sign-in is disabled" />;
  }

  return <SignIn {...props} />;
}

export function SignUpCompat(props) {
  if (!isClerkEnabled) {
    return <DemoAuthNotice title="Student sign-up is disabled" />;
  }

  return <SignUp {...props} />;
}

function useMockAuth() {
  return {
    isLoaded: true,
    isSignedIn: false,
    getToken: async () => null,
  };
}

function useMockUser() {
  return {
    isLoaded: true,
    isSignedIn: false,
    user: null,
  };
}

function useMockClerk() {
  return {
    signOut: async () => {},
  };
}

const useAuthImpl = isClerkEnabled ? useAuth : useMockAuth;
const useUserImpl = isClerkEnabled ? useUser : useMockUser;
const useClerkImpl = isClerkEnabled ? useClerk : useMockClerk;

export function useAuthCompat() {
  return useAuthImpl();
}

export function useUserCompat() {
  return useUserImpl();
}

export function useClerkCompat() {
  return useClerkImpl();
}
