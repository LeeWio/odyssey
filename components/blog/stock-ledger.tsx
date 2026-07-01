"use client";

import type { CSSProperties } from "react";
import { Card, Chip } from "@heroui/react";
import { Carousel } from "@heroui-pro/react";
import { ArrowUpRight, ArrowDownRight } from "@gravity-ui/icons";

const MARKET_INDICES = [
  { name: "S&P 500 Index", ticker: "SPX", value: "5,117.10", change: "+0.45%", isPositive: true },
  { name: "NASDAQ 100", ticker: "NDX", value: "16,110.50", change: "+0.81%", isPositive: true },
  { name: "DOW JONES", ticker: "DJI", value: "39,131.50", change: "-0.12%", isPositive: false },
  { name: "BITCOIN", ticker: "BTC", value: "$64,250.00", change: "+1.25%", isPositive: true },
];

const PORTFOLIO_KPIS = [
  {
    title: "My Net Capital Allocation",
    value: "$142,850.40",
    change: "+$3,240.20 Today",
    percentage: "+2.32%",
    isPositive: true,
    description: "My combined liquid equity and cash reserves",
    bgStyle: "from-[#0d0d1e] via-[#15122e] to-[#1a113a]",
    glowStyle: "bg-[#7c3aed]/20",
  },
  {
    title: "Cumulative Realized P&L",
    value: "+$18,240.20",
    change: "Fiscal Year Performance",
    percentage: "+14.6%",
    isPositive: true,
    description: "Net realized trade results to date",
    bgStyle: "from-[#022c22] via-[#043e32] to-[#01251c]",
    glowStyle: "bg-emerald-500/10",
  },
  {
    title: "Personal Trade Win Ratio",
    value: "82.4%",
    change: "41 Wins",
    percentage: "9 Losses",
    isPositive: true,
    description: "Profitable closed trade setups this quarter",
    bgStyle: "from-[#1d1202] via-[#2d1b04] to-[#1a1002]",
    glowStyle: "bg-amber-500/15",
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
    gradient: "from-emerald-600 via-emerald-500 to-teal-400",
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
    gradient: "from-indigo-600 via-purple-500 to-pink-500",
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
    gradient: "from-rose-600 via-rose-500 to-orange-400",
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
    gradient: "from-blue-600 via-indigo-500 to-cyan-400",
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
    gradient: "from-amber-600 via-amber-500 to-yellow-400",
  },
];

const QUANT_RULES = [
  {
    id: 1,
    rule: "Trade with Macro Structural Trend",
    desc: "Only commit allocation when multi-timeframe market momentum on the major indices is in structural expansion phase.",
  },
  {
    id: 2,
    rule: "Hardcoded -5% Execution Stop-Loss",
    desc: "Protect principal liquidity. Stop-loss orders are automatically triggered at exactly -5% from avg entry cost with zero exceptions.",
  },
  {
    id: 3,
    rule: "Single Position Sizing Limits",
    desc: "Strict exposure diversification limits. Capital allocation into any single trade setup is capped at 15% of net liquidation value.",
  },
];

export function StockLedger() {
  return (
    <section className="border-border/10 bg-background relative flex w-full flex-col justify-center overflow-hidden border-t px-6 py-20 lg:px-12">
      {/* Background soft subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 opacity-15">
        <div className="bg-success-soft/5 pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 w-full">
        {/* Responsive Split-Column Partition Layout */}
        <div className="grid w-full grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* LEFT SIDEBAR (Spans 5 columns): Personal Intro, Active Market Thesis, KPI Wallet, Guardrails */}
          {/* Note: Sticky on desktop so as you scroll the long list of holdings on the right, my philosophy and wallet stay pinned in place */}
          <div className="flex h-fit flex-col gap-8 lg:sticky lg:top-24 lg:col-span-5">
            {/* My Personal Trading Header */}
            <div className="flex flex-col gap-2.5">
              <Chip
                color="accent"
                size="sm"
                variant="soft"
                className="bg-accent/5 text-accent border-accent/10 w-fit border font-semibold tracking-wider uppercase"
              >
                My Investment Journal
              </Chip>
              <h2 className="text-foreground text-3xl font-extrabold tracking-tight">
                My Quantitative Ledger
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                A personal repository documenting my systematic capital allocations, algorithmic
                trade executions, and the strict risk rules governing my portfolio.
              </p>
            </div>

            {/* My Active Market Thesis Note (Extremely Personal Touch) */}
            <Card className="border-border/10 bg-default-50/5 flex flex-col gap-2.5 rounded-2xl border p-5">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-success relative inline-flex size-2 rounded-full" />
                </span>
                <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wider uppercase">
                  Active Market Thesis (Q3 2026)
                </span>
              </div>
              <p className="text-foreground/90 text-xs leading-relaxed font-medium">
                &ldquo;Anticipating a range-bound consolidation phase in high-beta tech assets. I am
                systematically scaling down tech exposure, expanding my cash buffer, and awaiting
                structural accumulation zones in index ETF proxies.&rdquo;
              </p>
            </Card>

            {/* Wallet-Style Personal KPI Cards Stack */}
            <div className="flex flex-col gap-4">
              <span className="text-muted-foreground/50 text-xs font-bold tracking-widest uppercase">
                My Portfolio Ledger
              </span>
              <div className="flex flex-col gap-4">
                {PORTFOLIO_KPIS.map((kpi, idx) => (
                  <Card
                    key={idx}
                    className={`relative overflow-hidden border border-white/10 bg-gradient-to-br p-6 ${kpi.bgStyle} flex h-[150px] flex-col justify-between rounded-3xl text-white shadow-md transition-all duration-300 hover:shadow-xl`}
                  >
                    {/* Holographic Glowing Orb */}
                    <div
                      className={`absolute -top-12 -right-12 size-36 rounded-full ${kpi.glowStyle} blur-3xl`}
                    />

                    <div className="z-10 flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-white/60 uppercase">
                        {kpi.title}
                      </span>
                      <span className="my-1 font-mono text-3xl font-extrabold tracking-tight tabular-nums">
                        {kpi.value}
                      </span>
                    </div>

                    <div className="z-10 flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-xs font-medium text-white/60">{kpi.description}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] font-semibold text-white/40">
                          {kpi.change}
                        </span>
                        <Chip
                          size="sm"
                          variant="soft"
                          className="h-5 min-h-5 border border-white/10 bg-white/20 px-1.5 font-mono text-[10px] font-bold text-white"
                        >
                          {kpi.percentage}
                        </Chip>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* My Trading Guardrails Stack */}
            <div className="flex flex-col gap-4">
              <span className="text-muted-foreground/50 text-xs font-bold tracking-widest uppercase">
                My Trading Guardrails
              </span>
              <div className="flex flex-col gap-4">
                {QUANT_RULES.map((rule) => (
                  <Card
                    key={rule.id}
                    className="border-border/5 bg-default-50/5 flex flex-col gap-2 rounded-2xl border p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-accent/10 border-accent/20 text-accent flex size-6 items-center justify-center rounded-full border font-mono text-xs font-extrabold">
                        0{rule.id}
                      </div>
                      <span className="text-foreground text-sm font-bold tracking-tight">
                        {rule.rule}
                      </span>
                    </div>
                    <p className="text-muted-foreground pl-8 text-xs leading-relaxed">
                      {rule.desc}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT AREA (Spans 7 columns): Indices, Featured Transactions, Active Holdings Glass Cards */}
          <div className="flex flex-col gap-10 lg:col-span-7">
            {/* Live Market Index Cards Row */}
            <div className="flex flex-col gap-4">
              <span className="text-muted-foreground/50 text-xs font-bold tracking-widest uppercase">
                Global Market Context
              </span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {MARKET_INDICES.map((index, idx) => (
                  <Card
                    key={idx}
                    className="flex flex-row items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md transition-[transform,border-color,background-color] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-white/10 hover:bg-white/10 active:scale-[0.98]"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold tracking-wider text-white/60 uppercase">
                        {index.name}
                      </span>
                      <span className="text-sm font-bold tracking-tight text-white">
                        {index.ticker}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-sm font-bold tracking-tight text-white tabular-nums">
                        {index.value}
                      </span>
                      <span
                        className={`flex items-center gap-0.5 font-mono text-[11px] font-bold ${index.isPositive ? "text-success" : "text-danger"}`}
                      >
                        {index.isPositive ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {index.change}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* My Featured Transactions (The Carousel) */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground/50 text-xs font-bold tracking-widest uppercase">
                  My Featured Setups
                </span>
                <h3 className="text-foreground text-lg font-bold">Recent Position Snapshots</h3>
              </div>

              <div className="relative w-full">
                <Carousel
                  opts={{
                    align: "center",
                    loop: true,
                  }}
                  className="w-full overflow-visible"
                  style={{ "--carousel-gap": "20px" } as CSSProperties}
                >
                  <Carousel.Content className="flex w-full">
                    {STOCK_TRANSACTIONS.map((item) => {
                      const isPositive = !item.roi.startsWith("-");

                      return (
                        <Carousel.Item
                          key={item.id}
                          className="basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/2"
                        >
                          <div className="p-1">
                            {/* Square Premium Glass Card */}
                            <Card className="relative aspect-square w-full overflow-hidden rounded-[28px] border border-white/15 bg-cover bg-center shadow-xl transition-[transform,box-shadow,border-color,background-color] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] select-none hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.98] active:translate-y-0">
                              {/* Fluid silk background gradient */}
                              <div
                                className={`absolute inset-0 bg-gradient-to-tr ${item.gradient} opacity-95`}
                              />

                              {/* Glassy reflection effects */}
                              <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-16 -left-16 size-48 rounded-full bg-white/20 blur-2xl" />
                                <div className="absolute -right-16 -bottom-16 size-40 rounded-full bg-black/15 blur-2xl" />
                                {/* Inner card hairline border for glass definition */}
                                <div className="absolute inset-px rounded-[27px] border border-white/10" />
                              </div>

                              {/* Top floating metadata */}
                              <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between">
                                {/* Floating Glass ROI Tag */}
                                <div className="z-20 flex items-center gap-1 rounded-full border border-white/20 bg-white/20 px-2.5 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md">
                                  <span className="font-mono text-xs font-bold tracking-tight text-white">
                                    {item.roi}
                                  </span>
                                </div>

                                {/* Floating Glass Action Tag */}
                                <div className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 backdrop-blur-md">
                                  <span className="text-[9px] font-bold tracking-widest text-white/95 uppercase">
                                    {item.action}
                                  </span>
                                </div>
                              </div>

                              {/* Center Display: Execution Price */}
                              <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pb-12">
                                <span className="mb-1 text-[9px] font-bold tracking-widest text-white/70 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                                  Execution Price
                                </span>
                                <span className="font-mono text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
                                  {item.price}
                                </span>
                              </div>

                              {/* Dark Glass Bottom Overlay (Identical to Screenshot Bottom Bar) */}
                              <div className="absolute right-3 bottom-3 left-3 z-10 flex items-center justify-between rounded-[20px] border border-white/10 bg-black/45 p-3.5 text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm leading-none font-bold tracking-tight">
                                    {item.ticker}
                                  </span>
                                  <span
                                    className="block max-w-[120px] truncate text-[10px] font-medium text-white/75"
                                    title={item.companyName}
                                  >
                                    {item.companyName}
                                  </span>

                                  {/* Shares and Status line */}
                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    <span
                                      className={`size-1.5 rounded-full ${item.isHolding ? "animate-pulse bg-emerald-400" : "bg-white/40"}`}
                                    />
                                    <span className="text-[9px] font-bold tracking-wider text-white/60 uppercase">
                                      {item.shares} · {item.statusText}
                                    </span>
                                  </div>
                                </div>

                                {/* Circular action button */}
                                <button
                                  type="button"
                                  className="flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                                  aria-label={`View details for ${item.ticker}`}
                                >
                                  {isPositive ? (
                                    <ArrowUpRight className="size-4.5 font-bold text-emerald-600" />
                                  ) : (
                                    <ArrowDownRight className="size-4.5 font-bold text-rose-600" />
                                  )}
                                </button>
                              </div>
                            </Card>
                          </div>
                        </Carousel.Item>
                      );
                    })}
                  </Carousel.Content>
                  <Carousel.Previous />
                  <Carousel.Next />
                </Carousel>
              </div>
            </div>

            {/* My Active Core Allocations (Sleek Glass Card Grid) */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground/50 text-xs font-bold tracking-widest uppercase">
                  My Active Portfolio
                </span>
                <h3 className="text-foreground text-lg font-bold">Current Strategic Positions</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3">
                {STOCK_TRANSACTIONS.map((stock) => {
                  const isPositive = !stock.roi.startsWith("-");
                  return (
                    <Card
                      key={stock.id}
                      className="flex h-[175px] flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/10"
                    >
                      {/* Top: Asset Ticker & Type */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-8 rounded-xl bg-gradient-to-tr ${stock.gradient} flex items-center justify-center text-[10px] font-bold text-white shadow-sm shadow-black/10`}
                          >
                            {stock.ticker.slice(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold tracking-tight text-white">
                              {stock.ticker}
                            </span>
                            <span
                              className="block max-w-[90px] truncate text-[10px] text-white/60"
                              title={stock.companyName}
                            >
                              {stock.companyName}
                            </span>
                          </div>
                        </div>

                        <Chip
                          size="sm"
                          variant="soft"
                          className="h-4.5 min-h-4.5 border border-white/10 bg-white/10 px-1.5 text-[9px] font-bold tracking-wider text-white uppercase"
                        >
                          {stock.action}
                        </Chip>
                      </div>

                      {/* Mid-Row: Price, Size, ROI */}
                      <div className="my-2 grid grid-cols-3 gap-2 border-t border-b border-white/5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-bold tracking-wider text-white/40 uppercase">
                            Avg Cost
                          </span>
                          <span className="font-mono text-xs font-bold text-white/90 tabular-nums">
                            {stock.price}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[8px] font-bold tracking-wider text-white/40 uppercase">
                            Size
                          </span>
                          <span className="font-mono text-xs font-semibold text-white/85 tabular-nums">
                            {stock.shares.split(" ")[0]}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[8px] font-bold tracking-wider text-white/40 uppercase">
                            ROI
                          </span>
                          <span
                            className={`flex items-center gap-0.5 font-mono text-xs font-bold ${isPositive ? "text-success" : "text-danger"}`}
                          >
                            {stock.roi}
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Holding Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`size-1.5 rounded-full ${stock.isHolding ? "animate-pulse bg-emerald-400" : "bg-white/40"}`}
                          />
                          <span className="text-[10px] font-semibold text-white/75">
                            {stock.statusText}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] font-bold tracking-wider uppercase ${stock.isHolding ? "text-warning" : "text-white/40"}`}
                        >
                          {stock.isHolding ? "Active" : "Neutral"}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
