"use client";

import { pageEaseOut } from "@/lib/motion";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Card, Chip, Typography, Button } from "@heroui/react";
import { HoverCard, EmptyState } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

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
    id: "get-posts",
    method: "GET",
    path: "/single",
    description: "东鳞西爪。文章列表和单篇都从这里读，不是一条叫 chronicles 的接口。",
    params: [],
    mockResponse: {
      note: "这是页面，不是可试的接口。打开 /single 看文章。",
    },
  },
  {
    id: "get-guestbook",
    method: "GET",
    path: "/guestbook",
    description: "墙上的句子。阅读公开，写一句需要登录，写完会先看过。",
    params: [],
    mockResponse: {
      note: "这里不会替你提交留言。去 /guestbook 写。",
    },
  },
  {
    id: "get-footprints",
    method: "GET",
    path: "/footprints",
    description: "落过脚的地方。地点是页面里的一份清单，不是一条公开查询接口。",
    params: [],
    mockResponse: {
      note: "打开 /footprints 看地图。",
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
    <div className="bg-background min-h-[100dvh] w-full px-4 pt-28 pb-24 md:px-6 lg:pt-32 xl:px-8">
      <div className="flex w-full flex-col gap-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: pageEaseOut }}
          className="max-w-xl"
        >
          <Chip color="accent" size="sm" variant="soft">
            不会发请求
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance"
          >
            这几处怎么进
          </Typography>
          <Typography color="muted" type="body" className="mt-4 leading-7">
            左边是入口，右边是一句说明。点发送只会把这句说明显示出来，不会打到服务器。
          </Typography>
        </motion.header>

        {/* Console split view grid */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col gap-4">
            {/* Endpoints menu */}
            <Card variant="secondary" className="p-4">
              <span className="text-muted/60 mb-3 block pl-1 font-mono text-[9px] font-bold tracking-wider uppercase">
                入口
              </span>
              <div className="flex flex-col gap-2">
                {API_ENDPOINTS.map((endpoint) => {
                  const isActive = endpoint.id === activeEndpoint.id;
                  return (
                    <Button
                      key={endpoint.id}
                      fullWidth
                      variant={isActive ? "secondary" : "ghost"}
                      onPress={() => setActiveEndpointId(endpoint.id)}
                      aria-pressed={isActive}
                    >
                      <Chip
                        size="sm"
                        variant="soft"
                        color={endpoint.method === "GET" ? "success" : "warning"}
                      >
                        {endpoint.method}
                      </Chip>
                      <Typography type="body-xs">{endpoint.path}</Typography>
                    </Button>
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
                  说明
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
                  <Icon icon="gravity-ui:arrow-clockwise" className="size-4 animate-spin" />
                ) : (
                  <Icon icon="gravity-ui:paper-plane" className="size-4" />
                )}
                看这句说明
              </Button>
            </Card>
          </div>

          {/* Right panel: Response terminal */}
          <Card variant="secondary" className="flex min-h-[32rem] flex-col overflow-hidden">
            {/* Response Console Topbar */}
            <div className="border-default-100 flex shrink-0 items-center justify-between border-b bg-black/35 px-5 py-4 font-mono text-xs">
              <span className="text-muted/60 font-bold tracking-wider uppercase">看一句</span>

              {/* Dynamic Status chip */}
              {responseState.status && (
                <Chip size="sm" variant="soft" color="success">
                  {responseState.status} {responseState.statusText}
                </Chip>
              )}
            </div>

            {/* Response payload terminal area */}
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              {responseState.loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <Icon
                    icon="gravity-ui:arrow-clockwise"
                    className="text-accent size-8 animate-spin"
                  />
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
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <Icon icon="gravity-ui:database" aria-hidden="true" />
                    </EmptyState.Media>
                    <EmptyState.Title>Console Offline</EmptyState.Title>
                    <EmptyState.Description>
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
                  <Icon icon="gravity-ui:clock" className="text-success size-3" />
                  PROXY TIME: 1.2s
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon icon="gravity-ui:cpu" className="size-3 text-cyan-500" />
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
