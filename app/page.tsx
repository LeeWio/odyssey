"use client";

import React, { useState } from "react";
import { Surface, Button } from "@heroui/react";
import { AnimatePresence } from "motion/react";
import { HelloApple } from "@/components/home/hello-apple";

export default function Home() {
  const [show, setShow] = useState(true);

  return (
    <Surface
      variant="transparent"
      className="bg-background relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute top-10 z-10 flex flex-col items-center gap-4">
        <Button variant="primary" onPress={() => setShow(!show)}>
          {show ? "Hide Animation" : "Show Animation"}
        </Button>
      </div>

      <div className="relative flex w-full max-w-4xl flex-col items-center justify-center px-6">
        <AnimatePresence>{show && <HelloApple />}</AnimatePresence>
      </div>
    </Surface>
  );
}
