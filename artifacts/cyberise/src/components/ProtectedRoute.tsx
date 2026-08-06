import { useAuth, useUser, SignIn } from "@clerk/clerk-react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [dismissed, setDismissed] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--dark-bg)] via-[var(--dark-surface)] to-[var(--dark-card)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--dark-bg)] via-[var(--dark-surface)] to-[var(--dark-card)] flex items-center justify-center">
        <AnimatePresence>
          {!dismissed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dark-bg)]/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[var(--dark-surface)] border border-[var(--primary)]/20 rounded-xl p-6 max-w-md w-full mx-4 relative"
              >
                <button
                  onClick={() => setDismissed(true)}
                  className="absolute top-3 right-3 text-[#666] hover:text-white text-sm"
                >
                  ✕
                </button>
                <h2 className="text-xl font-bold text-white mb-6 text-center">
                  Sign in required
                </h2>
                <SignIn />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {dismissed && <Redirect to="/" />}
      </div>
    );
  }

  if (requireAdmin) {
    const isAdmin =
      user?.publicMetadata?.role === "ADMIN" ||
      user?.unsafeMetadata?.role === "ADMIN";
    if (!isAdmin) {
      return <Redirect to="/dashboard" />;
    }
  }

  return <>{children}</>;
}
