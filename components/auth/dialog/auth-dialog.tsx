"use client";

import { useState } from "react";
import { AuthDialogShell } from "./auth-shell";
import { AuthStep } from "./auth-step";
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
  const isOpen = mode !== null;

  return (
    <AuthDialogShell
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onModeChange(null);
      }}
    >
      <div className="flex min-h-0 flex-col" inert={isOpen ? undefined : true}>
        <AuthStep stepKey={displayedMode} className="gap-0">
          {displayedMode === "login" ? (
            <LoginContent
              isActive={mode === "login"}
              onSuccess={() => onModeChange(null)}
              onSwitchToSignUp={() => onModeChange("signup")}
            />
          ) : (
            <SignupContent
              isActive={mode === "signup"}
              onDone={() => onModeChange(null)}
              onSwitchToLogIn={() => onModeChange("login")}
            />
          )}
        </AuthStep>
      </div>
    </AuthDialogShell>
  );
}
