import { useSSO } from "@clerk/expo/experimental";
import { useState } from "react";

import { clerkErrorMessage } from "@/lib/clerk-errors";

export function useGoogleAuth() {
  const { startSSOFlow } = useSSO();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    if (isPending) return;

    setIsPending(true);
    setError("");

    try {
      const { createdSessionId } = await startSSOFlow({
        strategy: "oauth_google",
      });

      // No session id means the guest cancelled; do nothing.
      if (!createdSessionId) return;
      // The experimental hook activates the completed session itself.
    } catch (err) {
      setError(
        clerkErrorMessage(err, "Google sign-in didn't finish. Try again."),
      );
    } finally {
      setIsPending(false);
    }
  };

  return { signInWithGoogle, isPending, error, clearError: () => setError("") };
}
