import { ClerkProvider, useAuth, RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, type ReactNode } from "react";

const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    return useAuth();
  }
  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
