"use client";

import { Surface } from "@heroui/react";
import { HelloApple } from "@/components/home/hello-apple";

export default function Home() {
  return (
    <Surface
      variant="transparent"
      className="bg-background relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
    >
      <div className="relative flex w-full max-w-4xl flex-col items-center justify-center px-6">
        <HelloApple />
      </div>
    </Surface>
  );
}
