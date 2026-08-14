"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Card, Chip, Typography, Button, cn } from "@heroui/react";
import { HoverCard, EmptyState } from "@heroui-pro/react";
import { Terminal, Send, Database, Cpu, RefreshCw, Clock } from "lucide-react";

const easeOut = [0.22, 1, 0.36, 1] as const;

type ParamType = {
  name: string;
  required: boolean;
  type: string;
  defaultVal: string;
  description: string;
};

type Endpoint = {
  id: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  params: ParamType[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockResponse: Record<string, any>;
};

const API_ENDPOINTS: Endpoint[] = [
  {
    id: "get-chronicles",
    method: "GET",
    path: "/api/chronicles",
    description:
      "Fetch high-fidelity, peer-vetted technical essays categorized by design and systems.",
    params: [
      {
        name: "category",
        required: false,
        type: "string",
        defaultVal: "systems",
        description: "Filter essays by category. Options: systems | frontend | creative",
      },
      {
        name: "limit",
        required: false,
        type: "number",
        defaultVal: "5",
        description: "The maximum number of chronicles to return.",
      },
    ],
    mockResponse: {
      success: true,
      count: 2,
      data: [
        {
          id: "e1",
          title: "Fluid Interfaces: The Invisible Mechanics of Motion",
          category: "frontend",
          readingTime: 10,
          publishedAt: "2026-05-18",
        },
        {
          id: "s1",
          title: "RTOS Kernel Scheduling and Priority Inversions",
          category: "systems",
          readingTime: 15,
          publishedAt: "2026-07-22",
        },
      ],
    },
  },
  {
    id: "get-vae-stream",
    method: "GET",
    path: "/api/vae-stream",
    description:
      "Intercepts dynamic requests for the Chinese singer Vae (许嵩) and maps secure CDN stream URLs.",
    params: [
      {
        name: "title",
        required: true,
        type: "string",
        defaultVal: "雅俗共赏",
        description: "The exact name of the song to resolve from Kuwo CDN. Fallback: 浅唱",
      },
    ],
    mockResponse: {
      success: true,
      title: "雅俗共赏",
      duration: 245,
      codec: "AAC High Definition",
      streamUrl:
        "https://secure-cdn.kuwo.cn/audio/yashugongshang_secure_128k.mp3?token=odyssey_7fc3b",
      redirectSecure: true,
    },
  },
  {
    id: "post-guestbook",
    method: "POST",
    path: "/api/guestbook",
    description: "Saves a public message or visitor comment into the moderated platform guestbook.",
    params: [
      {
        name: "comment",
        required: true,
        type: "string",
        defaultVal: "Awesome portfolio design!",
        description: "The raw text comment content to submit for moderation.",
      },
    ],
    mockResponse: {
      success: true,
      message: "Comment submitted successfully.",
      status: "pending_moderation",
      comment: {
        id: "cmt_4fc92",
        content: "Awesome portfolio design!",
        createdAt: "2026-08-14T12:00:00Z",
      },
    },
  },
];

export function ApiConsolePage() {
  const [activeEndpointId, setActiveEndpointId] = useState(API_ENDPOINTS[0]?.id || "");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [responseState, setResponseState] = useState<{
    status: number | null;
    statusText: string;
    loading: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any | null;
  }>({
    status: null,
    statusText: "",
    loading: false,
    data: null,
  });

  const activeEndpoint = useMemo(() => {
    return API_ENDPOINTS.find((e) => e.id === activeEndpointId) || API_ENDPOINTS[0];
  }, [activeEndpointId]);

  // Handle single param input mutations
  const handleParamChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  // Resolve current param value matching active endpoint
  const getParamValue = (name: string, defaultVal: string) => {
    return paramValues[`${activeEndpoint.id}-${name}`] !== undefined
      ? paramValues[`${activeEndpoint.id}-${name}`]
      : defaultVal;
  };

  // Send request simulation
  const handleSendRequest = () => {
    setResponseState({ status: null, statusText: "", loading: true, data: null });

    setTimeout(() => {
      // Build mock dynamic response parameters
      const finalResponse = { ...activeEndpoint.mockResponse };

      if (activeEndpoint.id === "get-vae-stream") {
        const queryTitle = getParamValue("title", "雅俗共赏");
        finalResponse.title = queryTitle;
        finalResponse.streamUrl = `https://secure-cdn.kuwo.cn/audio/${encodeURIComponent(queryTitle)}_secure_128k.mp3?token=odyssey_7fc3b`;
      } else if (activeEndpoint.id === "post-guestbook") {
        const queryComment = getParamValue("comment", "Awesome portfolio design!");
        finalResponse.comment.content = queryComment;
      }

      setResponseState({
        status: 200,
        statusText: "OK",
        loading: false,
        data: finalResponse,
      });
    }, 1200);
  };

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="border-default-200/50 mb-12 flex flex-col items-center border-b pb-8 text-center"
        >
          <Chip color="accent" size="sm" variant="soft" className="gap-1.5 pl-2">
            <Terminal className="text-accent size-3" />
            API Playground Console
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-4xl leading-tight text-balance sm:text-5xl"
          >
            Interactive API Sandboxes
          </Typography>
          <Typography color="muted" type="body" className="mt-4 max-w-xl leading-relaxed">
            Directly test the core endpoints driving the Odyssey workspace. Inspect contracts, hover
            over schemas, and fetch live telemetry payloads.
          </Typography>
        </motion.header>

        {/* Console split view grid */}
        <div className="mt-10 grid items-start gap-6 md:grid-cols-12">
          {/* Left panel: Endpoints selector & Param inputs */}
          <div className="flex flex-col gap-5 md:col-span-5">
            {/* Endpoints menu */}
            <Card
              variant="secondary"
              className="border-default-200/50 bg-surface-secondary/20 rounded-2xl border p-4 shadow-sm"
            >
              <span className="text-muted/60 mb-3 block pl-1 font-mono text-[9px] font-bold tracking-wider uppercase">
                API CONTRACT LIST
              </span>
              <div className="flex flex-col gap-2">
                {API_ENDPOINTS.map((endpoint) => {
                  const isActive = endpoint.id === activeEndpoint.id;
                  return (
                    <button
                      key={endpoint.id}
                      onClick={() => setActiveEndpointId(endpoint.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all duration-200",
                        isActive
                          ? "bg-accent/10 border-accent/40 text-accent font-bold"
                          : "border-default-100/50 hover:bg-default-100/30 text-foreground bg-transparent"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-bold",
                            endpoint.method === "GET"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          )}
                        >
                          {endpoint.method}
                        </span>
                        <span className="truncate font-mono text-xs">{endpoint.path}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Parameters & Send triggers panel */}
            <Card
              variant="secondary"
              className="border-default-200/50 bg-surface-secondary/20 flex flex-col gap-5 rounded-2xl border p-5 shadow-sm"
            >
              <div>
                <span className="text-muted/60 mb-1 block font-mono text-[9px] font-bold tracking-wider uppercase">
                  QUERY PARAMETERS
                </span>
                <Typography color="muted" type="body-xs">
                  Hover over parameters with the underline to inspect definitions.
                </Typography>
              </div>

              {activeEndpoint.params.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {activeEndpoint.params.map((param) => (
                    <div key={param.name} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        {/* HoverCard triggers schema tooltip definitions */}
                        <HoverCard openDelay={0} closeDelay={150}>
                          <HoverCard.Trigger>
                            <span className="text-foreground border-default-300 hover:border-accent cursor-help border-b border-dashed font-mono text-xs font-semibold">
                              {param.name}
                              {param.required && <span className="text-danger ml-0.5">*</span>}
                            </span>
                          </HoverCard.Trigger>
                          <HoverCard.Content className="bg-background border-default-200 w-64 rounded-xl border p-3 shadow-lg">
                            <HoverCard.Arrow />
                            <div className="flex flex-col gap-1.5 text-xs">
                              <div className="text-muted/60 flex items-center justify-between font-mono text-[10px] font-bold uppercase">
                                <span>TYPE: {param.type}</span>
                                <span className={param.required ? "text-danger" : "text-success"}>
                                  {param.required ? "REQUIRED" : "OPTIONAL"}
                                </span>
                              </div>
                              <p className="text-foreground font-semibold">{param.name}</p>
                              <p className="text-muted/80 text-xs leading-relaxed">
                                {param.description}
                              </p>
                              <div className="border-default-100 text-muted/40 border-t pt-1.5 font-mono text-[9px]">
                                DEFAULT: &quot;{param.defaultVal}&quot;
                              </div>
                            </div>
                          </HoverCard.Content>
                        </HoverCard>

                        <span className="text-muted/50 font-mono text-[10px] uppercase">
                          {param.type}
                        </span>
                      </div>

                      {/* Input fields */}
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        value={getParamValue(param.name, param.defaultVal)}
                        onChange={(e) =>
                          handleParamChange(`${activeEndpoint.id}-${param.name}`, e.target.value)
                        }
                        className="border-default-200/60 bg-background/50 focus:border-accent/40 w-full rounded-xl border px-3 py-2 font-mono text-xs focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted/50 py-6 text-center text-xs italic">
                  No parameters required for this endpoint.
                </div>
              )}

              {/* Submit trigger button */}
              <Button
                isDisabled={responseState.loading}
                onPress={handleSendRequest}
                className="bg-accent mt-2 w-full gap-2 rounded-xl border-none font-bold text-white"
              >
                {responseState.loading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send Live Request
              </Button>
            </Card>
          </div>

          {/* Right panel: Response terminal */}
          <Card
            variant="secondary"
            className="border-default-200/50 bg-surface-secondary/10 flex min-h-[460px] flex-col overflow-hidden rounded-2xl border shadow-sm md:col-span-7"
          >
            {/* Response Console Topbar */}
            <div className="border-default-100 flex shrink-0 items-center justify-between border-b bg-black/35 px-5 py-4 font-mono text-xs">
              <span className="text-muted/60 font-bold tracking-wider uppercase">
                RESPONSE PAYLOAD
              </span>

              {/* Dynamic Status chip */}
              {responseState.status && (
                <Chip size="sm" variant="soft" color="success" className="font-bold">
                  {responseState.status} {responseState.statusText}
                </Chip>
              )}
            </div>

            {/* Response payload terminal area */}
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              {responseState.loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <RefreshCw className="text-accent size-8 animate-spin" />
                  <span className="text-muted/60 font-mono text-xs">
                    Executing dynamic proxy resolver...
                  </span>
                </div>
              ) : responseState.data ? (
                <div className="h-full max-h-[440px] overflow-auto bg-black/40 p-5 font-mono text-[11px] text-cyan-400 md:p-6">
                  <pre className="leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(responseState.data, null, 2)}
                  </pre>
                </div>
              ) : (
                /* EmptyState displays clean fallback when no requests have been sent yet */
                <EmptyState className="p-8">
                  <EmptyState.Header>
                    <EmptyState.Media
                      variant="icon"
                      className="bg-default-100/50 border-default-200 border"
                    >
                      <Database className="text-muted/60" />
                    </EmptyState.Media>
                    <EmptyState.Title className="mt-4 text-sm font-bold">
                      Console Offline
                    </EmptyState.Title>
                    <EmptyState.Description className="text-muted/60 mt-1 max-w-xs text-xs">
                      No request blocks executed. Fine-tune your endpoint parameters on the left and
                      click &quot;Send Live Request&quot; to trigger actual CDN streams.
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              )}
            </div>

            {/* Custom Telemetry bottom bar */}
            {responseState.data && (
              <div className="border-default-100/60 text-muted/40 flex shrink-0 items-center justify-between border-t bg-black/25 px-5 py-3 font-mono text-[10px] font-semibold uppercase">
                <span className="flex items-center gap-1">
                  <Clock className="text-success size-3" />
                  PROXY TIME: 1.2s
                </span>
                <span className="flex items-center gap-1.5">
                  <Cpu className="size-3 text-cyan-500" />
                  Vae song redirected safely
                </span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
