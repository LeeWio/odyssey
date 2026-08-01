"use client";

import { HelloApple } from "@/components/home/hello-apple";

export default function Home() {
  return (
    <main className="bg-background relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
        <HelloApple />
      </div>
    </main>
  );
}
