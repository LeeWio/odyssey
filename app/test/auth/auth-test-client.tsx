"use client";

import { Button } from "@heroui/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AuthDialog, type AuthMode } from "@/components/auth/auth-dialog";

const Grainient = dynamic(() => import("@/components/background/grainient"), {
  ssr: false,
});

export default function AuthTestClient() {
  const [mode, setMode] = useState<AuthMode | null>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (root.current) root.current.dataset.ready = "true";
  }, []);
  return (
    <main ref={root} className="relative isolate flex min-h-screen gap-4 overflow-hidden p-8">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20">
        <Grainient
          className="size-full"
          timeSpeed={0.18}
          colorBalance={0.08}
          warpStrength={1.4}
          warpFrequency={3.2}
          warpSpeed={0.7}
          warpAmplitude={38}
          blendSoftness={0.16}
          rotationAmount={280}
          noiseScale={1.6}
          grainAmount={0.035}
          grainScale={2.4}
          contrast={1.25}
          saturation={1.12}
          zoom={0.72}
        />
      </div>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-black/20" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:56px_56px] opacity-20"
      />
      <div className="relative z-10 flex gap-4">
        <Button onPress={() => setMode("login")}>Open login</Button>
        <Button onPress={() => setMode("signup")}>Open signup</Button>
      </div>
      <AuthDialog mode={mode} onModeChange={setMode} />
    </main>
  );
}
