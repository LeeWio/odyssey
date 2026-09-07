"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { AuthDialog, type AuthMode } from "@/components/auth/auth-dialog";

export default function AuthTestClient() {
  const [mode, setMode] = useState<AuthMode | null>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (root.current) root.current.dataset.ready = "true";
  }, []);
  return (
    <main ref={root} className="flex gap-4 p-8">
      <Button onPress={() => setMode("login")}>Open login</Button>
      <Button onPress={() => setMode("signup")}>Open signup</Button>
      <AuthDialog mode={mode} onModeChange={setMode} />
    </main>
  );
}
