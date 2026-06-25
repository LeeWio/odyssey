"use client";

import { useState, useEffect } from "react";
import { Card, Chip, Button } from "@heroui/react";
import { Carousel } from "@heroui-pro/react";
import type { EmblaCarouselType } from "embla-carousel";
import { ArrowUpRight, ArrowDownRight } from "@gravity-ui/icons";

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
    // Custom beautiful upward neon sparkline path
    sparkline: "M 0 80 Q 100 40 200 60 T 400 20 T 600 10",
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
    sparkline: "M 0 70 Q 120 50 240 30 T 480 20 T 600 15",
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
    // Tactical downward wave
    sparkline: "M 0 20 Q 120 40 240 70 T 480 85 T 600 95",
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
    sparkline: "M 0 60 Q 100 30 200 50 T 400 15 T 600 10",
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
    sparkline: "M 0 80 Q 120 50 240 60 T 480 30 T 600 25",
  },
];

export function StockLedger() {
  const [api, setApi] = useState<EmblaCarouselType>();

  return (
    <section className="border-border/10 bg-background relative flex w-full flex-col justify-center overflow-hidden border-t px-6 py-20 lg:px-12">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="bg-success-soft/10 pointer-events-none absolute top-1/2 left-1/2 h-80 w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 flex w-full flex-col gap-8">
        {/* Section Header */}
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <Chip
            color="accent"
            size="sm"
            variant="soft"
            className="bg-accent/5 text-accent border-accent/10 border font-semibold tracking-wider uppercase"
          >
            Trading Journal
          </Chip>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            The Quantitative Ledger
          </h2>
          <p className="text-muted max-w-xl text-sm">
            A real-time investment log documenting trading executions, tactical positions, and
            equity performance.
          </p>
        </div>

        {/* 100% Standard HeroUI Pro Carousel with Extreme Quality Square Cards */}
        <div className="relative w-full">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full overflow-visible"
            style={{ "--carousel-gap": "20px" } as any}
          >
            <Carousel.Content className="flex w-full">
              {STOCK_TRANSACTIONS.map((item) => {
                const isBuy = item.action === "BUY";
                const isPositive = !item.roi.startsWith("-");

                return (
                  <Carousel.Item key={item.id} className="basis-full sm:basis-1/3 md:basis-1/4">
                    <div className="p-1">
                      <Card className="select-none">
                        <Card.Header>
                          <Card.Title>{item.ticker}</Card.Title>
                          <Card.Description>{item.companyName}</Card.Description>
                        </Card.Header>
                        <Card.Content className="flex w-full flex-col">
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`size-1.5 rounded-full ${
                                  isBuy ? "bg-success animate-pulse" : "bg-danger"
                                }`}
                              />
                              <span className="text-muted/50 font-mono text-[10px] font-bold tracking-wider uppercase">
                                {item.action}
                              </span>
                            </div>
                          </div>
                        </Card.Content>

                        <Card.Footer className="flex flex-row items-center justify-between">
                          <Chip
                            size="sm"
                            variant="soft"
                            color={item.isHolding ? "success" : "default"}
                            className="text-[10px] font-bold tracking-wider uppercase"
                          >
                            {item.statusText}
                          </Chip>
                          <Button size="sm" variant="ghost">
                            Details
                          </Button>
                        </Card.Footer>
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
    </section>
  );
}
