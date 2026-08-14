"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Chip, Typography } from "@heroui/react";
import {
  ChatConversation,
  ChatMessage,
  PromptInput,
  PromptSuggestion,
  TextShimmer,
  type ChatStatus,
} from "@heroui-pro/react";
import { Markdown } from "@heroui-pro/react/markdown";
import { Sparkles, ArrowUp, Terminal, Cpu, Monitor, Compass, Mail } from "lucide-react";

const easeOut = [0.22, 1, 0.36, 1] as const;

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const SUGGESTIONS = [
  { icon: Compass, label: "Tell me about your design philosophy", query: "design philosophy" },
  {
    icon: Monitor,
    label: "What hardware & software do you use?",
    query: "what hardware and software setup do you use?",
  },
  {
    icon: Cpu,
    label: "What is your low-level system experience?",
    query: "rtos systems and low-level coding experience",
  },
  { icon: Mail, label: "How can I contact or connect with you?", query: "how can I contact you" },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "init-1",
    role: "assistant",
    text: "Hi there! I'm the **Odyssey AI Copilot** — your spatial guide to this creative notebook. Ask me about my design philosophy, the physical equipment I use, low-level RTOS engineering, or how to navigate the 3D Constellations world!",
  },
];

export function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<ChatStatus>("ready");
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const handleStop = () => {
    clearTimers();
    setStatus("ready");
  };

  const getAssistantResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (
      q.includes("about") ||
      q.includes("who") ||
      q.includes("story") ||
      q.includes("genesis") ||
      q.includes("philosophy")
    ) {
      return `### 🎨 Design Philosophy & Genesis

**Odyssey** is a living visual notebook structured as a connected workspace rather than a flat, traditional chronological blog directory. 

My work thrives at the intersection of high-fidelity aesthetics, low-level compilation pipelines, and deliberate human disciplines.

#### 🏛️ The Four Pillars:
1. **Cinematic Aesthetics**: Digital spaces should feel alive, deep, and intentional. I combine subtle post-processing, light blooms, and spatial depth.
2. **Accessibility by Default**: Beauty is empty if locked away. Every component strictly follows WCAG parameters, focusing on keyboard loops and ARIA semantic landmarks.
3. **Low-Level Code**: Focused on performant architectures (Rust compilations, C, RTOS kernel performance, and GPU-driven shaders).
4. **Analog Observances**: Deliberately framing geometry on medium-format analog film (Hasselblad), bringing the same patience back into clean code boundaries.`;
    }

    if (
      q.includes("uses") ||
      q.includes("setup") ||
      q.includes("equipment") ||
      q.includes("hardware") ||
      q.includes("software") ||
      q.includes("macbook") ||
      q.includes("staples")
    ) {
      return `### ⚙️ Hardware, Software, & Equipment Setup

Here are the staples that power my daily productivity and audio synthesis workflows:

#### 💻 Workspace Staples
- **MacBook Pro 16"**: M3 Max with 64GB Unified RAM and 2TB SSD — handles hefty compilers and 3D scenes effortlessly.
- **Studio Display**: 27-inch 5K Retina Display with unmatched text clarity and color calibration.
- **Herman Miller Aeron**: Ergonomic support for prolonged structural design and coding sprints.

#### 🛠️ Development environment
- **VS Code**: Heavily tailored theme and optimized extensions with **Geist Mono** as the primary typeface.
- **Ghostty**: Blazingly responsive GPU-accelerated terminal emulator built in Zig.
- **Raycast**: A keyboard-centric spotlight replacement driving workflow automations and window scaling.

#### 🎙️ Audio Gear
- **AirPods Max**: High-fidelity spatial audio and isolation for deep focus intervals.
- **Shure SM7B + Scarlett**: Broadcaster mic paired with a Scarlett dynamic converter for ultra-crisp meeting audio.`;
    }

    if (
      q.includes("rtos") ||
      q.includes("qnx") ||
      q.includes("low-level") ||
      q.includes("embedded") ||
      q.includes("rust") ||
      q.includes("compiler") ||
      q.includes("rendering") ||
      q.includes("system")
    ) {
      return `### ⚡ Low-Level Systems & Graphics Engineering

My technical background is rooted in performant, reliable kernel execution and pipeline compiling:

#### 🛡️ Embedded RTOS Kernels
- **QNX RTOS**: Analyzing microkernel scheduling, message-passing IPC overheads, and implementing priority-inheritance drivers to avoid deadlock states.
- **Kernel Scheduling**: Configuring strict deadline constraints in mission-critical real-time setups.

#### 🦀 Compiler Architectures & Shaders
- **Compiler Construction**: Writing lexical parsers and recursive-descent syntax tree compilers in **Rust** to optimize bytecode.
- **GPU Shaders**: Dissecting Navier-Stokes fluid simulations and developing grid-based particle rendering systems using **WebGL/GLSL** fragments.`;
    }

    if (
      q.includes("constellation") ||
      q.includes("galaxy") ||
      q.includes("space") ||
      q.includes("3d") ||
      q.includes("planet") ||
      q.includes("stars")
    ) {
      return `### 🌌 The 3D interactive Constellations Space

The **Constellations View** (\`/constellations\`) is a customized spatial map designed to represent knowledge relationships physically:

- **Ethereal Orbits**: Concentric orbits revolving around galaxies representing structural knowledge directories (Creative, Design, Systems).
- **Local Dust Fields**: Swirling clouds of hundreds of glowing star-dust particles colored according to the core galaxy's brand.
- **Article Satellites**: Glowing knowledge spheres (individual essays) orbiting planets in real-time.
- **Cinematic Director**: Selecting a planet triggers a smooth, mathematical camera push-in and target lerp for a highly focused overview.`;
    }

    if (
      q.includes("contact") ||
      q.includes("email") ||
      q.includes("github") ||
      q.includes("social") ||
      q.includes("connect")
    ) {
      return `### 📬 Connect & Collaborate

I am always excited to discuss high-fidelity interfaces, RTOS kernel hacking, or analog gear:

- **Email**: [support@example.com](mailto:support@example.com) — reach out for active inquiries or collabs.
- **GitHub**: [github.com/heroui-inc/heroui](https://github.com/heroui-inc/heroui) — browse my open-source projects.
- **Command Palette**: Press \`Cmd+K\` anywhere on the platform to jump across pages using keyboard-shortcuts.`;
    }

    return `I am here to guide you through Odyssey! You can ask me questions about:
    
1. **The Vision**: How Odyssey differs from a traditional database-blog (\`about\` or \`philosophy\`).
2. **My Rig**: What physical equipment, modular synths, and software editors I run daily (\`setup\` or \`hardware\`).
3. **Systems & Graphics**: RTOS scheduler analysis, compiler design in Rust, and WebGL physics (\`low level\` or \`qnx\`).
4. **Interactive Map**: How the 3D WebGL starry galaxy was built and connected (\`constellations\` or \`orbits\`).

Feel free to pick one of the suggestions below, or type your own question!`;
  };

  const handleSubmit = (overrideQuery?: string) => {
    const queryText = overrideQuery || value;
    const trimmed = queryText.trim();

    if (!trimmed || status !== "ready") return;

    const userMessage: Message = {
      id: String(Date.now()),
      role: "user",
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setValue("");
    setStatus("submitted");
    clearTimers();

    timersRef.current.push(
      window.setTimeout(() => setStatus("streaming"), 300),
      window.setTimeout(() => {
        const reply = getAssistantResponse(trimmed);
        setMessages((current) => [
          ...current,
          {
            id: String(Date.now() + 1),
            role: "assistant",
            text: reply,
          },
        ]);
        setStatus("ready");
      }, 1500)
    );
  };

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto flex h-[calc(100dvh-14rem)] w-full max-w-3xl flex-col">
        {/* Header Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mb-6 flex flex-col items-center text-center"
        >
          <Chip color="accent" size="sm" variant="soft" className="gap-1.5 pl-2">
            <Sparkles className="text-accent size-3" />
            Odyssey AI Assistant
          </Chip>
          <Typography type="h2" weight="bold" className="mt-3 tracking-tight">
            Ask Odyssey Copilot
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            An interactive assistant designed with HeroUI Pro AI components to guide your
            exploration.
          </Typography>
        </motion.div>

        {/* Message Feed Conversation */}
        <div className="border-default-200 bg-surface-secondary/40 mb-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border shadow-sm">
          <ChatConversation className="flex-1 overflow-y-auto p-4 md:p-6">
            <ChatConversation.Content className="max-w-none flex-col gap-6">
              {messages.map((message) =>
                message.role === "user" ? (
                  <ChatMessage.User key={message.id}>
                    <ChatMessage.Bubble className="bg-default-100 border-default-200/50 border">
                      <ChatMessage.Content className="text-foreground text-sm leading-relaxed">
                        {message.text}
                      </ChatMessage.Content>
                    </ChatMessage.Bubble>
                  </ChatMessage.User>
                ) : (
                  <ChatMessage.Assistant key={message.id}>
                    <ChatMessage.Avatar
                      show
                      alt="Assistant"
                      className="border border-cyan-800 bg-cyan-950 font-bold text-cyan-400"
                      fallback="AI"
                    />
                    <ChatMessage.Body>
                      <ChatMessage.Content className="text-foreground prose dark:prose-invert max-w-none text-sm leading-relaxed">
                        <Markdown>{message.text}</Markdown>
                      </ChatMessage.Content>
                    </ChatMessage.Body>
                  </ChatMessage.Assistant>
                )
              )}

              {status === "streaming" && (
                <ChatMessage.Assistant key="loader">
                  <ChatMessage.Avatar
                    show
                    alt="Assistant"
                    className="border border-cyan-800 bg-cyan-950 font-bold text-cyan-400"
                    fallback="AI"
                  />
                  <ChatMessage.Body>
                    <ChatMessage.Content className="text-sm">
                      <TextShimmer className="font-medium text-cyan-500">
                        Formulating guide...
                      </TextShimmer>
                    </ChatMessage.Content>
                  </ChatMessage.Body>
                </ChatMessage.Assistant>
              )}
            </ChatConversation.Content>
          </ChatConversation>
        </div>

        {/* Suggestions Group */}
        {messages.length === 1 && status === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 w-full"
          >
            <PromptSuggestion>
              <PromptSuggestion.Items className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map(({ icon: IconComponent, label, query }) => (
                  <PromptSuggestion.Item
                    key={label}
                    className="bg-surface-secondary border-default-200/60 hover:bg-default-100/50 group h-auto items-center justify-start rounded-xl border p-3 text-left transition-all duration-200"
                    showEndIcon={false}
                    onPress={() => {
                      setValue(query);
                      handleSubmit(query);
                    }}
                  >
                    <span className="inline-flex min-w-0 items-center gap-3">
                      <div className="bg-default-100/80 text-default-500 group-hover:bg-default-200 group-hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-105">
                        <IconComponent className="size-4" />
                      </div>
                      <span className="text-muted/90 group-hover:text-foreground truncate text-xs font-semibold">
                        {label}
                      </span>
                    </span>
                  </PromptSuggestion.Item>
                ))}
              </PromptSuggestion.Items>
            </PromptSuggestion>
          </motion.div>
        )}

        {/* Text Input Composer */}
        <PromptInput
          status={status}
          value={value}
          onSubmit={() => handleSubmit()}
          onStop={handleStop}
          onValueChange={setValue}
          className="w-full"
          size="md"
        >
          <PromptInput.Shell className="border-default-200 bg-surface-secondary/40 focus-within:border-accent/40 rounded-2xl border shadow-sm">
            <PromptInput.Content>
              <PromptInput.TextArea
                placeholder="Ask about design philosophy, hardware setup, system cores..."
                className="placeholder:text-muted/50 text-sm"
              />
            </PromptInput.Content>
            <PromptInput.Toolbar>
              <PromptInput.ToolbarStart>
                <div className="text-muted/60 flex items-center gap-1.5 pl-2 text-xs">
                  <Terminal className="size-3.5" />
                  <span className="font-mono font-semibold tracking-wide uppercase">
                    Local Stream
                  </span>
                </div>
              </PromptInput.ToolbarStart>
              <PromptInput.ToolbarEnd>
                <PromptInput.Send className="bg-accent/10 hover:bg-accent/20 text-accent flex size-8 items-center justify-center rounded-xl p-0">
                  <ArrowUp className="size-4" />
                </PromptInput.Send>
              </PromptInput.ToolbarEnd>
            </PromptInput.Toolbar>
          </PromptInput.Shell>
        </PromptInput>
      </div>
    </div>
  );
}
