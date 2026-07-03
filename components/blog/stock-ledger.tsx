"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { Card, Chip, Separator, Surface, Typography, Avatar, ColorSwatch } from "@heroui/react";
import { Carousel, KPI, KPIGroup, PieChart, ChartTooltip } from "@heroui-pro/react";

const PORTFOLIO_KPIS = [
  {
    id: 1,
    title: "Portfolio Value",
    value: "$142,850.40",
    change: "+$3,240.20 Today",
    percentage: "+2.32%",
    isPositive: true,
    description: "Net asset value of cash and active stock holdings.",
  },
  {
    id: 2,
    title: "YTD Return",
    value: "+$18,240.20",
    change: "Fiscal Year Performance",
    percentage: "+14.6%",
    isPositive: true,
    description: "Net profit generated since January 1st.",
  },
  {
    id: 3,
    title: "Profit Factor",
    value: "2.42",
    change: "41 Wins / 9 Losses",
    percentage: "Elite (> 2.0)",
    isPositive: true,
    description: "Ratio of gross gains vs gross losses. Target is > 1.5.",
  },
];

const STOCK_TRANSACTIONS = [
  {
    id: 1,
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    action: "BUY",
    roi: "+22.4%",
    shares: "120 Shrs",
    price: "$118.50",
    statusText: "Holding",
    isHolding: true,
  },
  {
    id: 2,
    ticker: "AAPL",
    companyName: "Apple Inc.",
    action: "SELL",
    roi: "+14.8%",
    shares: "50 Shrs",
    price: "$214.20",
    statusText: "Realized",
    isHolding: false,
  },
  {
    id: 3,
    ticker: "TSLA",
    companyName: "Tesla, Inc.",
    action: "BUY",
    roi: "-3.2%",
    shares: "80 Shrs",
    price: "$178.90",
    statusText: "Holding",
    isHolding: true,
  },
  {
    id: 4,
    ticker: "MSFT",
    companyName: "Microsoft Corp.",
    action: "BUY",
    roi: "+8.5%",
    shares: "30 Shrs",
    price: "$415.00",
    statusText: "Holding",
    isHolding: true,
  },
  {
    id: 5,
    ticker: "BABA",
    companyName: "Alibaba Group",
    action: "BUY",
    roi: "+11.2%",
    shares: "150 Shrs",
    price: "$72.40",
    statusText: "Holding",
    isHolding: true,
  },
];

const QUANT_RULES = [
  {
    id: 1,
    rule: "Trade with Trend",
    desc: "Only buy when major market indices show upward momentum on multiple timeframes.",
    color: "#F59E0B",
  },
  {
    id: 2,
    rule: "Snappy -5% Stop-Loss",
    desc: "Cut losses immediately. Orders trigger automatically at -5% from cost.",
    color: "#EF4444",
  },
  {
    id: 3,
    rule: "Position Limits",
    desc: "Keep exposure diversified. No single trade can exceed 15% of net value.",
    color: "#0485F7",
  },
];

// Curated pool of elite investment philosophy quotes from world-class masters
const MASTER_QUOTES = [
  {
    quote:
      "If you aren't willing to own a stock for ten years, don't even think about owning it for ten minutes.",
    author: "Warren Buffett",
  },
  {
    quote: "The big money is not in the buying and the selling, but in the waiting.",
    author: "Charlie Munger",
  },
  {
    quote: "In the stock market, the most important organ is the stomach, not the brain.",
    author: "Peter Lynch",
  },
  {
    quote:
      "It's not whether you're right or wrong, but how much you make when you're right and how much you lose when you're wrong.",
    author: "George Soros",
  },
];

const CHART_COLORS = [
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-5)",
];

// Helper to extract a clean float number from formatted KPI value strings
const parseNumericValue = (str: string): number => {
  const cleaned = str.replace(/[$,%+]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    payload?: { fill?: string };
    value?: number | string;
  }>;
  valueFormatter?: (value: number | string) => React.ReactNode;
}

function PieTooltip({ active, payload, valueFormatter }: PieTooltipProps) {
  const entry = payload?.[0];

  if (!active || !entry) return null;

  return (
    <ChartTooltip>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color={entry.payload?.fill} />
        <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
        <ChartTooltip.Value>
          {valueFormatter ? valueFormatter(entry.value ?? "") : entry.value}
        </ChartTooltip.Value>
      </ChartTooltip.Item>
    </ChartTooltip>
  );
}

export function StockLedger() {
  // Local sync states
  const [transactions, setTransactions] = useState(STOCK_TRANSACTIONS);
  const [kpis, setKpis] = useState(PORTFOLIO_KPIS);
  const [rules, setRules] = useState(QUANT_RULES);
  const [thesis, setThesis] = useState("");

  // Select a random master quote on initial mount to keep the dashboard inspiring
  const [activeQuote, setActiveQuote] = useState(MASTER_QUOTES[0]);

  // Fetch from localStorage if set (prevents SSR hydration error and synchronous cascading effect state update)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadData = () => {
        const storedTx = localStorage.getItem("odyssey_portfolio_transactions");
        const storedKpis = localStorage.getItem("odyssey_portfolio_kpis");
        const storedRules = localStorage.getItem("odyssey_portfolio_rules");
        const storedThesis = localStorage.getItem("odyssey_portfolio_thesis");

        if (storedTx) setTransactions(JSON.parse(storedTx));
        if (storedKpis) setKpis(JSON.parse(storedKpis));
        if (storedRules) setRules(JSON.parse(storedRules));
        if (storedThesis) setThesis(storedThesis);

        // Pick a random quote on mount for a delightful, refreshing touch
        const randomIndex = Math.floor(Math.random() * MASTER_QUOTES.length);
        setActiveQuote(MASTER_QUOTES[randomIndex]);
      };
      setTimeout(loadData, 0);
    }
  }, []);

  // Filter transactions to find recently bought stock positions (action === "BUY")
  const recentBuys = useMemo(() => {
    return transactions.filter((t) => t.action === "BUY");
  }, [transactions]);

  // Convert local KPI states into numeric format for HeroUI Pro's KPI component
  const kpiData = useMemo(() => {
    return kpis.map((k) => {
      const numVal = parseNumericValue(k.value);
      const isWinRatio = k.title.toLowerCase().includes("win");
      const isProfitFactor = k.title.toLowerCase().includes("factor");
      return {
        ...k,
        numericValue: numVal,
        isCurrency: !isWinRatio && !isProfitFactor,
        trend: k.isPositive ? ("up" as const) : ("down" as const),
      };
    });
  }, [kpis]);

  // Dynamic Holding Ratio Calculation for Pie Chart
  const holdingData = useMemo(() => {
    const activeHoldings = transactions.filter((t) => t.isHolding);

    const details = activeHoldings
      .map((t) => {
        const sharesNum = parseFloat(t.shares.replace(/[^\d.]/g, ""));
        const priceNum = parseFloat(t.price.replace(/[^\d.]/g, ""));
        const value = isNaN(sharesNum) || isNaN(priceNum) ? 0 : sharesNum * priceNum;
        return {
          name: t.ticker,
          value: value,
        };
      })
      .filter((d) => d.value > 0);

    const totalValue = details.reduce((sum, d) => sum + d.value, 0);

    if (details.length === 0) {
      return {
        list: [
          { name: "NVDA", value: 14220 },
          { name: "TSLA", value: 14312 },
          { name: "MSFT", value: 12450 },
          { name: "BABA", value: 10860 },
        ],
        total: 51842,
      };
    }

    return {
      list: details,
      total: totalValue,
    };
  }, [transactions]);

  const displayQuote = useMemo(() => {
    if (
      thesis &&
      thesis.trim() !== "" &&
      thesis !==
        "Holding a cash buffer and scaling down high-beta tech exposure. Waiting for better entry points in index ETFs during range-bound tech consolidation."
    ) {
      return {
        quote: thesis,
        author: "Personal Strategy",
      };
    }
    return activeQuote;
  }, [thesis, activeQuote]);

  return (
    <Surface
      variant="transparent"
      className="border-border/40 bg-background mx-auto flex w-full max-w-7xl flex-col gap-8 border-t px-6 py-16 lg:px-12"
    >
      <Surface variant="transparent" className="flex flex-col gap-2">
        <Typography
          type="body-xs"
          color="muted"
          weight="bold"
          className="tracking-widest uppercase"
        >
          Investment Journal
        </Typography>
        <Typography type="h1" className="text-foreground text-3xl font-extrabold tracking-tight">
          My Portfolio Ledger
        </Typography>
        <Typography type="body-sm" color="muted" className="max-w-3xl leading-relaxed">
          A clean dashboard to track my stocks, trading rules, and investment notes.
        </Typography>
      </Surface>

      <Surface variant="transparent" className="w-full">
        <KPIGroup>
          {kpiData.map((stat, idx) => (
            <Fragment key={stat.id || idx}>
              {idx > 0 && <KPIGroup.Separator />}
              <KPI>
                <KPI.Header>
                  <KPI.Title>{stat.title}</KPI.Title>
                </KPI.Header>
                <KPI.Content>
                  <KPI.Value
                    currency={stat.isCurrency ? "USD" : undefined}
                    maximumFractionDigits={stat.isCurrency ? 0 : 2}
                    style={stat.isCurrency ? "currency" : "decimal"}
                    value={stat.numericValue}
                  />
                  <KPI.Trend trend={stat.trend}>{stat.percentage}</KPI.Trend>
                </KPI.Content>
              </KPI>
            </Fragment>
          ))}
        </KPIGroup>
      </Surface>

      <Surface variant="transparent" className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <Surface variant="transparent" className="flex flex-col gap-6 lg:col-span-4">
          <Card variant="default">
            <Card.Header>
              <Card.Title className="text-base font-bold">Asset Allocation</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col items-center gap-4">
              <PieChart height={220}>
                <PieChart.Pie
                  cx="50%"
                  cy="50%"
                  data={holdingData.list}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                >
                  {holdingData.list.map((_, idx) => (
                    <PieChart.Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </PieChart.Pie>
                <PieChart.Tooltip
                  content={
                    <PieTooltip
                      valueFormatter={(v) =>
                        `${((Number(v) / holdingData.total) * 100).toFixed(1)}%`
                      }
                    />
                  }
                />
              </PieChart>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                {holdingData.list.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="text-muted text-xs">{entry.name}</span>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          <Card variant="default">
            <Card.Content className="flex flex-col gap-3">
              <Typography
                type="body"
                weight="medium"
                className="text-foreground/90 font-serif leading-relaxed italic"
              >
                &ldquo;{displayQuote.quote}&rdquo;
              </Typography>
              <div className="mt-1 flex justify-end">
                <Typography type="body-xs" color="muted" className="font-semibold">
                  — {displayQuote.author}
                </Typography>
              </div>
            </Card.Content>
          </Card>

          <Card variant="default">
            <Card.Header>
              <Card.Title className="text-muted text-xs font-bold tracking-wide uppercase">
                Risk Rules
              </Card.Title>
              <Card.Description className="text-accent mt-1 text-xl font-bold">
                Trading Rules
              </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4 pb-4">
              {rules.map((rule, idx) => (
                <div key={rule.id || idx} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <ColorSwatch
                      key={rule.color}
                      color={rule.color}
                      className="size-4"
                      style={({ color: c }) => ({
                        background: `linear-gradient(135deg, ${c.toString("css")}, white)`,
                      })}
                    />
                    <Typography
                      type="h5"
                      weight="bold"
                      className="text-foreground text-sm tracking-tight"
                    >
                      {rule.rule}
                    </Typography>
                  </div>
                  <Typography type="body-xs" color="muted" className="pl-7 leading-relaxed">
                    {rule.desc}
                  </Typography>
                </div>
              ))}
            </Card.Content>
          </Card>
        </Surface>

        <Surface variant="transparent" className="flex flex-col gap-6 lg:col-span-8">
          <Surface variant="transparent" className="flex flex-col gap-4">
            <Surface variant="transparent" className="flex items-center justify-between">
              <Typography type="h3" className="text-foreground text-lg font-bold tracking-tight">
                Recently Bought
              </Typography>
              <Chip
                size="sm"
                variant="soft"
                color="success"
                className="font-bold tracking-wider uppercase"
              >
                LATEST
              </Chip>
            </Surface>

            <Surface variant="transparent" className="relative w-full overflow-hidden">
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <Carousel.Content>
                  {recentBuys.map((item, idx) => (
                    <Carousel.Item key={item.id || idx} className="basis-full sm:basis-1/2">
                      <div className="p-1 transition-transform duration-150 active:scale-[0.98]">
                        <Card variant="default">
                          <Card.Header className="flex flex-row items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                              <Typography
                                type="h5"
                                color="default"
                                weight="bold"
                                title={item.ticker}
                              >
                                {item.ticker}
                              </Typography>
                              <Typography
                                type="body-xs"
                                color="muted"
                                truncate
                                title={item.companyName}
                              >
                                {item.companyName}
                              </Typography>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-success size-1.5 animate-pulse rounded-full" />
                              <Chip size="sm" variant="soft" color="success" className="font-bold">
                                BUY
                              </Chip>
                            </div>
                          </Card.Header>
                          <Card.Content>
                            <div className="flex items-center justify-between text-xs">
                              <Typography type="body-xs" color="muted">
                                Avg Cost
                              </Typography>
                              <Typography
                                type="body-xs"
                                weight="bold"
                                className="text-foreground font-mono"
                              >
                                {item.price}
                              </Typography>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-xs">
                              <Typography
                                type="body-xs"
                                color="muted"
                                weight="normal"
                                align="start"
                              >
                                Size
                              </Typography>
                              <Typography
                                type="body-xs"
                                weight="semibold"
                                className="text-foreground/80"
                              >
                                {item.shares}
                              </Typography>
                            </div>
                          </Card.Content>
                          <Card.Footer className="border-border/20 mt-1 flex flex-row justify-between border-t pt-2.5">
                            <Typography type="body-xs" color="muted" weight="normal" align="start">
                              ROI
                            </Typography>
                            <Typography
                              type="body-xs"
                              weight="bold"
                              align="end"
                              className={
                                !item.roi.startsWith("-")
                                  ? "text-success font-mono"
                                  : "text-danger font-mono"
                              }
                            >
                              {item.roi}
                            </Typography>
                          </Card.Footer>
                        </Card>
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
              </Carousel>
            </Surface>
          </Surface>

          <Card variant="default">
            <Card.Header>
              <Card.Title className="text-muted text-xs font-bold tracking-wide uppercase">
                Active Strategic Positions
              </Card.Title>
              <Card.Description className="text-danger mt-1 text-xl font-bold">
                Current Positions
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {transactions.map((stock, idx) => {
                  const isPositive = !stock.roi.startsWith("-");
                  return (
                    <div
                      key={stock.id || idx}
                      className="transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <Card variant="secondary">
                        <Card.Content className="flex flex-col justify-between">
                          {/* Top: Asset Ticker & Type */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar size="sm" color="default">
                                <Avatar.Fallback className="text-[10px] font-bold">
                                  {stock.ticker.slice(0, 2)}
                                </Avatar.Fallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <Typography
                                  type="h5"
                                  weight="bold"
                                  className="text-foreground text-sm tracking-tight"
                                >
                                  {stock.ticker}
                                </Typography>
                                <Typography
                                  type="body-xs"
                                  color="muted"
                                  truncate
                                  className="mt-0.5 block max-w-[80px] text-[9px] leading-none"
                                  title={stock.companyName}
                                >
                                  {stock.companyName}
                                </Typography>
                              </div>
                            </div>

                            <Chip size="sm" variant="soft" className="font-bold uppercase">
                              {stock.action}
                            </Chip>
                          </div>

                          {/* Mid-Row: Price, Size, ROI with Separators */}
                          <div className="my-1">
                            <Separator />
                            <div className="grid grid-cols-3 gap-1 py-1.5 text-center">
                              <div className="flex flex-col items-start gap-0.5">
                                <Typography
                                  type="body-xs"
                                  color="muted"
                                  weight="bold"
                                  className="text-[8px] uppercase"
                                >
                                  Cost
                                </Typography>
                                <Typography
                                  type="body-xs"
                                  weight="bold"
                                  className="text-foreground font-mono text-[10px]"
                                >
                                  {stock.price}
                                </Typography>
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                <Typography
                                  type="body-xs"
                                  color="muted"
                                  weight="bold"
                                  className="text-[8px] uppercase"
                                >
                                  Shrs
                                </Typography>
                                <Typography
                                  type="body-xs"
                                  weight="semibold"
                                  className="text-foreground/80 font-mono text-[10px]"
                                >
                                  {stock.shares.split(" ")[0]}
                                </Typography>
                              </div>
                              <div className="flex flex-col items-end gap-0.5">
                                <Typography
                                  type="body-xs"
                                  color="muted"
                                  weight="bold"
                                  className="text-[8px] uppercase"
                                >
                                  ROI
                                </Typography>
                                <Typography
                                  type="body-xs"
                                  weight="bold"
                                  className={`font-mono text-[10px] ${isPositive ? "text-success" : "text-danger"}`}
                                >
                                  {stock.roi}
                                </Typography>
                              </div>
                            </div>
                            <Separator />
                          </div>

                          {/* Bottom: Holding Status */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`size-1.5 rounded-full ${stock.isHolding ? "animate-pulse bg-emerald-400" : "bg-muted"}`}
                              />
                              <Typography
                                type="body-xs"
                                color="muted"
                                className="text-[9px] font-semibold"
                              >
                                {stock.statusText}
                              </Typography>
                            </div>

                            <Typography
                              type="body-xs"
                              className={`text-[9px] font-bold uppercase ${stock.isHolding ? "text-warning" : "text-muted"}`}
                            >
                              {stock.isHolding ? "Holding" : "Closed"}
                            </Typography>
                          </div>
                        </Card.Content>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </Card.Content>
          </Card>
        </Surface>
      </Surface>
    </Surface>
  );
}
