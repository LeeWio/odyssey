"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { Card, Chip, Separator, Surface, Typography, Avatar } from "@heroui/react";
import { Carousel, KPI, KPIGroup } from "@heroui-pro/react";
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
  },
  {
    id: 2,
    rule: "Snappy -5% Stop-Loss",
    desc: "Cut losses immediately. Orders trigger automatically at -5% from cost.",
  },
  {
    id: 3,
    rule: "Position Limits",
    desc: "Keep exposure diversified. No single trade can exceed 15% of net value.",
  },
];

// Helper to extract a clean float number from formatted KPI value strings
const parseNumericValue = (str: string): number => {
  const cleaned = str.replace(/[$,%+]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export function StockLedger() {
  // Local sync states
  const [transactions, setTransactions] = useState(STOCK_TRANSACTIONS);
  const [kpis, setKpis] = useState(PORTFOLIO_KPIS);
  const [rules, setRules] = useState(QUANT_RULES);
  const [thesis, setThesis] = useState(
    "Holding a cash buffer and scaling down high-beta tech exposure. Waiting for better entry points in index ETFs during range-bound tech consolidation."
  );

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

  return (
    <Surface
      variant="transparent"
      className="border-border/40 bg-background mx-auto flex w-full max-w-7xl flex-col gap-8 border-t px-6 py-16 lg:px-12"
    >
      {/* 1. HEADER SECTION */}
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

      {/* 2. PORTFOLIO KPIS (Premium, clean HeroUI Pro KPIGroup & KPI Components with absolute styling integrity) */}
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

      {/* 3. MAIN LAYOUT SPLIT GRID */}
      <Surface variant="transparent" className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: JOURNAL & NOTES (Spans 4/12) */}
        <Surface variant="transparent" className="flex flex-col gap-6 lg:col-span-4">
          {/* Market Thesis */}
          <Card variant="default">
            <Card.Header className="pb-2">
              <div className="flex items-center gap-1.5">
                <span className="relative flex size-1.5">
                  <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75">
                    {null}
                  </span>
                  <span className="bg-success relative inline-flex size-1.5 rounded-full">
                    {null}
                  </span>
                </span>
                <Typography
                  type="body-xs"
                  color="muted"
                  weight="bold"
                  className="tracking-widest uppercase"
                >
                  Outlook
                </Typography>
              </div>
              <Card.Title className="mt-1 text-base font-bold">Market Thesis</Card.Title>
            </Card.Header>
            <Card.Content className="pb-4">
              <Typography
                type="body-sm"
                weight="medium"
                className="text-foreground/85 leading-relaxed font-medium italic"
              >
                &ldquo;{thesis}&rdquo;
              </Typography>
            </Card.Content>
          </Card>

          {/* Trading Rules */}
          <Card variant="default">
            <Card.Header className="pb-2">
              <Typography
                type="body-xs"
                color="muted"
                weight="bold"
                className="tracking-widest uppercase"
              >
                Risk Rules
              </Typography>
              <Card.Title className="mt-1 text-base font-bold">Trading Rules</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4 pb-4">
              {rules.map((rule, idx) => (
                <div key={rule.id || idx} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary bg-primary/10 border-primary/20 flex size-5 shrink-0 items-center justify-center rounded-md border font-mono text-[9px] font-bold">{`0${idx + 1}`}</span>
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

        {/* RIGHT COLUMN: PORTFOLIO & RECENT (Spans 8/12) */}
        <Surface variant="transparent" className="flex flex-col gap-6 lg:col-span-8">
          {/* Recently Bought (Un-nested, extremely clean Carousel with absolute styling integrity) */}
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

          {/* Current Positions */}
          <Card variant="default">
            <Card.Header className="border-border/20 border-b pb-3">
              <Typography
                type="body-xs"
                color="muted"
                weight="bold"
                className="tracking-wider uppercase"
              >
                Active Strategic Positions
              </Typography>
              <Card.Title className="text-base font-bold">Current Positions</Card.Title>
            </Card.Header>
            <Card.Content className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {transactions.map((stock, idx) => {
                  const isPositive = !stock.roi.startsWith("-");
                  return (
                    <div
                      key={stock.id || idx}
                      className="transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <Card variant="secondary">
                        <Card.Content className="flex h-[160px] flex-col justify-between p-4">
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
