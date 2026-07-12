"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowUp,
  Microphone,
  CirclePlus,
  Paperclip,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ArrowsRotateLeft,
  Sparkles,
  LayoutHeaderCellsLargeThunderbolt,
  BookOpen,
  MusicNote,
  Terminal,
} from "@gravity-ui/icons";
import { Button, Card, Chip, Avatar, cn } from "@heroui/react";
import {
  PromptInput,
  PromptSuggestion,
  ChatMessage,
  TextShimmer,
  ChatLoader,
} from "@heroui-pro/react";
import { motion, AnimatePresence } from "motion/react";
import { useMounted } from "@mantine/hooks";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const SUGGESTIONS = [
  {
    Icon: Sparkles,
    label: "How can I balance Compilers and Sweat It Out?",
    detail: "Balance coding & fitness",
  },
  {
    Icon: LayoutHeaderCellsLargeThunderbolt,
    label: "Formulate a long-horizon thesis for Patience & Wait.",
    detail: "Isolate investment noise",
  },
  {
    Icon: MusicNote,
    label: "Select a focal sound brief for Soul Soothe.",
    detail: "Ambient works & vinyl setup",
  },
  {
    Icon: BookOpen,
    label: "How do I build a design system that survives a second draft?",
    detail: "Principles for structural humility",
  },
];

// Poetic responses corresponding to suggestion logs
const getOracleResponse = (prompt: string): string => {
  const normalized = prompt.toLowerCase();
  if (
    normalized.includes("balance") ||
    normalized.includes("compiler") ||
    normalized.includes("sweat")
  ) {
    return "To balance **Code & Build** (coding) and **Sweat It Out** (biomechanical physical calibration), treat them as two halves of a single pendulum.\n\nProgramming is a cognitive, high-load activity that constricts posture, narrows focus, and locks the body. Working out is a physical, high-load activity that expands them, opening your lungs and resetting your nervous system. \n\n*Never sacrifice one for the other.* 90 minutes of focused code deserves 45 minutes of heavy repetitions. It is the rhythmic oscillation between these two states that preserves sanity, mental clarity, and longevity.";
  }
  if (
    normalized.includes("patience") ||
    normalized.includes("stocks") ||
    normalized.includes("thesis") ||
    normalized.includes("wait")
  ) {
    return "A long-horizon thesis under **Patience & Wait** starts with isolating signals from daily feed noise.\n\nFinancial assets are representations of human energy and compounding capital. To wait is to practice extreme conviction. \n\n1. **Isolate**: Limit ticker checks to once daily, after market close.\n2. **Validate**: Write down your core investment thesis *before* entering any posture. If the thesis hasn't changed, do not touch the capital.\n3. **Postures**: Declare your risk parameters, allocate patience capital, and close the browser. In trading, your greatest compounding asset is not speed; it is your capacity to sit still and wait.";
  }
  if (
    normalized.includes("sound") ||
    normalized.includes("music") ||
    normalized.includes("soothe")
  ) {
    return "For **Soul Soothe**, curating a sound brief means matching the acoustics to your cognitive load density.\n\nAmbient works (e.g., Brian Eno, Harold Budd, or slow vinyl pressings) should act as auditory furniture—they must be felt, not actively listened to. \n\nWhen writing high-complexity compilers, use 60-70 BPM non-lyrical soundscapes to synchronize brainwave patterns and mask high-frequency background distractions. Let the frequency alter the room's temperature until the noise of the outside world fades into absolute acoustic isolation.";
  }
  if (
    normalized.includes("design") ||
    normalized.includes("system") ||
    normalized.includes("draft")
  ) {
    return "A design system survives contact with the second draft only if it is built with **structural humility**.\n\nMost components fail because they are over-engineered for the first draft's narrow requirements. To build for longevity, adopt these rules:\n\n* **Design for Deletion**: Keep components small, modular, and easily swappable.\n* **Semantic Abstraction**: Leverage semantic tokens (color, spacing, radius) rather than hardcoded styles.\n* **Composition over Inheritance**: Prioritize custom compound slot layouts over rigid monolithic components.\n\nHumility in design means accepting that you cannot predict the future; build scaffolds, not steel cages.";
  }
  return "The **Orbit** is a continuous loop. In this quiet digital sanctuary, every line compiled, every asset waited upon, every sweat droplet, and every frequency heard is a ritual of calibration.\n\nAsk me how to align your trajectory today, or describe what you want to build.";
};

export default function OdysseyOraclePage() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Greetings. I am the **Odyssey Oracle**, a silent digital companion designed to calibrate, reflect, and counsel on your daily **Orbit**.\n\nAsk me how to balance your routines, refine your design convictions, or shape the acoustics of a quiet day.",
    },
  ]);

  const mounted = useMounted();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const handleStop = () => {
    clearTimers();
    setStatus("ready");
    setMessages((current) => {
      if (current[current.length - 1]?.isStreaming) {
        return current.slice(0, -1);
      }
      return current;
    });
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || status !== "ready") return;

    setValue("");
    setStatus("submitted");
    clearTimers();

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    // 1. Add User Message
    setMessages((current) => [...current, { id: userMsgId, role: "user", content: trimmed }]);

    // 2. Simulate Oracle thinking state
    timersRef.current.push(
      window.setTimeout(() => {
        setStatus("streaming");
        setMessages((current) => [
          ...current,
          { id: assistantMsgId, role: "assistant", content: "", isStreaming: true },
        ]);
      }, 450)
    );

    // 3. Deliver Oracle streaming response
    timersRef.current.push(
      window.setTimeout(() => {
        const fullResponse = getOracleResponse(trimmed);
        setMessages((current) =>
          current.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: fullResponse, isStreaming: false } : msg
          )
        );
        setStatus("ready");
      }, 1600)
    );
  };

  if (!mounted) return null;

  return (
    <main className="bg-background relative min-h-[calc(100vh-4rem)] w-full overflow-hidden pt-8 pb-20">
      {/* Decorative background blurring light spot */}
      <div
        aria-hidden="true"
        className="bg-accent/5 dark:bg-accent/10 pointer-events-none absolute top-1/4 left-1/2 h-[35rem] w-[35rem] -translate-x-1/2 rounded-full blur-[120px]"
      />

      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-4">
        {/* Header Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Chip
            size="sm"
            variant="soft"
            color="accent"
            className="font-semibold tracking-wider uppercase"
          >
            Orbit Oracle
          </Chip>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Calibrate your trajectory with{" "}
            <TextShimmer className="text-accent font-semibold">Odyssey AI</TextShimmer>
          </h1>
          <p className="text-muted max-w-md text-sm">
            Reflect on your four daily pillars: Sound Soothe, Patience & Wait, Sweat It Out, and
            Code & Build.
          </p>
        </div>

        {/* Message Log Board */}
        <Card className="border-default/20 bg-default/40 flex min-h-[400px] flex-col gap-6 rounded-2xl border p-5 shadow-inner backdrop-blur-md md:p-6">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <ChatMessage.User key={msg.id}>
                    <ChatMessage.Bubble className="bg-accent text-accent-foreground rounded-2xl shadow-sm">
                      <ChatMessage.Content className="text-sm leading-relaxed font-medium">
                        {msg.content}
                      </ChatMessage.Content>
                    </ChatMessage.Bubble>
                  </ChatMessage.User>
                );
              }

              // Assistant message
              return (
                <ChatMessage.Assistant key={msg.id}>
                  <ChatMessage.Avatar
                    show
                    alt="Odyssey Oracle"
                    className="border-default size-8 border bg-zinc-950 shadow-sm dark:bg-black/60"
                    fallback="O"
                  />
                  <ChatMessage.Body>
                    <ChatMessage.Content className="text-foreground prose dark:prose-invert text-sm leading-relaxed">
                      {msg.isStreaming ? (
                        <div className="flex flex-col gap-2">
                          <TextShimmer className="text-muted text-xs">
                            Decoding the orbit...
                          </TextShimmer>
                          <ChatLoader.Dots label="Oracle thinking" />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </ChatMessage.Content>
                    {!msg.isStreaming && (
                      <ChatMessage.Actions className="mt-2.5">
                        <ChatMessage.Action
                          aria-label="Copy"
                          tooltip="Copy response"
                          size="sm"
                          className="size-7 rounded-md"
                        >
                          <Copy className="size-3.5" />
                        </ChatMessage.Action>
                        <ChatMessage.Action
                          aria-label="Good response"
                          tooltip="Helpful"
                          size="sm"
                          className="size-7 rounded-md"
                        >
                          <ThumbsUp className="size-3.5" />
                        </ChatMessage.Action>
                        <ChatMessage.Action
                          aria-label="Bad response"
                          tooltip="Unhelpful"
                          size="sm"
                          className="size-7 rounded-md"
                        >
                          <ThumbsDown className="size-3.5" />
                        </ChatMessage.Action>
                      </ChatMessage.Actions>
                    )}
                  </ChatMessage.Body>
                </ChatMessage.Assistant>
              );
            })}

            {status === "submitted" && (
              <ChatMessage.Assistant key="thinking">
                <ChatMessage.Avatar
                  show
                  alt="Odyssey Oracle"
                  className="border-default size-8 animate-pulse border bg-zinc-950 shadow-sm dark:bg-black/60"
                  fallback="O"
                />
                <ChatMessage.Body>
                  <TextShimmer className="text-muted text-sm">Listening...</TextShimmer>
                  <ChatLoader.Dots label="Oracle parsing" className="mt-1" />
                </ChatMessage.Body>
              </ChatMessage.Assistant>
            )}

            <div ref={chatEndRef} />
          </div>
        </Card>

        {/* Dynamic Composer & Suggestions */}
        <div className="flex flex-col gap-4">
          <PromptInput
            status={status}
            value={value}
            onStop={handleStop}
            onSubmit={handleSubmit}
            onValueChange={setValue}
            className="w-full"
            maxHeight={180}
            lockInputOnRun
          >
            <PromptInput.Shell className="border-default/25 shadow-overlay bg-background/88 rounded-2xl border backdrop-blur-xl">
              <PromptInput.Content>
                <PromptInput.TextArea
                  placeholder="Describe an app, request a daily routine audit, or type an inquiry..."
                  className="min-h-16 text-sm"
                />
              </PromptInput.Content>
              <PromptInput.Toolbar className="px-3 pb-3">
                <PromptInput.ToolbarStart>
                  <PromptInput.Action
                    aria-label="Use voice"
                    tooltip="Use voice"
                    size="sm"
                    className="size-8 rounded-xl"
                  >
                    <Microphone className="size-4" />
                  </PromptInput.Action>
                  <PromptInput.Action
                    aria-label="Add context"
                    tooltip="Add context"
                    size="sm"
                    className="size-8 rounded-xl"
                  >
                    <CirclePlus className="size-4" />
                  </PromptInput.Action>
                </PromptInput.ToolbarStart>
                <PromptInput.ToolbarEnd>
                  <PromptInput.Send
                    size="sm"
                    className="bg-accent text-accent-foreground size-8 rounded-xl"
                  />
                </PromptInput.ToolbarEnd>
              </PromptInput.Toolbar>
            </PromptInput.Shell>
            <PromptInput.Footer className="text-muted mt-2 text-center text-[11px]">
              The Oracle reflects based on your personal Orbit logs. Align your flow daily.
            </PromptInput.Footer>
          </PromptInput>

          {/* Prompt Suggestions List */}
          {status === "ready" && messages.length === 1 && (
            <PromptSuggestion className="w-full">
              <PromptSuggestion.Items className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map(({ Icon, label, detail }) => (
                  <PromptSuggestion.Item
                    key={label}
                    className="border-default/20 bg-default/10 hover:bg-default/20 items-center justify-start rounded-2xl border p-3 transition-all duration-200"
                    showEndIcon={false}
                    onPress={() => setValue(label)}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <div className="bg-default/40 border-default/15 text-accent flex size-8 shrink-0 items-center justify-center rounded-xl border">
                        <Icon className="size-4" />
                      </div>
                      <span className="flex min-w-0 flex-col text-left">
                        <span className="text-foreground truncate text-xs font-semibold">
                          {detail}
                        </span>
                        <span className="text-muted mt-0.5 truncate text-[10px]">{label}</span>
                      </span>
                    </span>
                  </PromptSuggestion.Item>
                ))}
              </PromptSuggestion.Items>
            </PromptSuggestion>
          )}
        </div>
      </div>
    </main>
  );
}
