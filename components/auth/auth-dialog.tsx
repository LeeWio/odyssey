"use client";

import { useState } from "react";
import { AuthDialogShell, AuthStep } from "./auth-layout";
import { LoginContent } from "./log-in";
import { SignupContent } from "./sign-up";

export type AuthMode = "login" | "signup";

interface AuthDialogProps {
  mode: AuthMode | null;
  onModeChange: (mode: AuthMode | null) => void;
}

export function AuthDialog({ mode, onModeChange }: AuthDialogProps) {
  // Keep the departing view intact while HeroUI animates the dialog closed.
  const [lastMode, setLastMode] = useState<AuthMode>(mode ?? "login");
  if (mode !== null && mode !== lastMode) setLastMode(mode);
  const displayedMode = mode ?? lastMode;

  return (
    <AuthDialogShell
      isOpen={mode !== null}
      onOpenChange={(open) => {
        if (!open) onModeChange(null);
      }}
    >
      <AuthStep stepKey={displayedMode} className="gap-0">
        {displayedMode === "login" ? (
          <LoginContent
            onSuccess={() => onModeChange(null)}
            onSwitchToSignUp={() => onModeChange("signup")}
          />
        ) : (
          <SignupContent
            onSuccess={() => onModeChange(null)}
            onSwitchToLogIn={() => onModeChange("login")}
          />
        )}
      </AuthStep>
    </AuthDialogShell>
  );
}
