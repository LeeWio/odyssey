"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Popover,
  Button,
  Spinner,
  SearchField,
  ListBox,
  ScrollShadow,
  ListLayout,
  Virtualizer,
  Description,
  Label,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";
import { useLazySearchStocksQuery } from "@/lib/features/stock/stock-api";
import { StockTrendCard } from "@/components/stock/stock-trend-card";
import { EmptyState } from "@heroui-pro/react";
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks";

interface StockSelectorProps {
  onSelect: (symbol: string | null) => void;
  attachedStockSymbol?: string | null;
}

const viewVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir * 30,
    filter: "blur(3px)",
  }),
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      x: { type: "spring" as const, stiffness: 350, damping: 32 },
      opacity: { duration: 0.18, ease: "easeOut" as const },
      filter: { duration: 0.18, ease: "easeOut" as const },
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -30,
    filter: "blur(3px)",
    transition: {
      x: { type: "spring" as const, stiffness: 350, damping: 32 },
      opacity: { duration: 0.12, ease: "easeIn" as const },
      filter: { duration: 0.12, ease: "easeIn" as const },
    },
  }),
};

export function StockSelector({ onSelect, attachedStockSymbol }: StockSelectorProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword] = useDebouncedValue(keyword, 400);
  const [triggerSearch, { data: stocks = [], isFetching }] = useLazySearchStocksQuery();

  const [view, setView] = useState<"search" | "preview">("search");
  const [tempSelectedSymbol, setTempSelectedSymbol] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      if (attachedStockSymbol) {
        setView("preview");
        setTempSelectedSymbol(attachedStockSymbol);
      } else {
        setView("search");
        setTempSelectedSymbol(null);
        setKeyword("");
      }
    }
  };

  useEffect(() => {
    if (!isOpen || view !== "search") return;
    if (!debouncedKeyword || debouncedKeyword.trim().length < 1) return;

    triggerSearch({ keyword: debouncedKeyword.trim() });
  }, [debouncedKeyword, isOpen, view, triggerSearch]);

  const handleSelectFromSearch = (symbol: string) => {
    setDirection(1);
    setTempSelectedSymbol(symbol);
    setView("preview");
  };

  const handleGoBackToSearch = () => {
    setDirection(-1);
    setTempSelectedSymbol(null);
    setView("search");
  };

  const handleAttachCommit = () => {
    if (tempSelectedSymbol) {
      onSelect(tempSelectedSymbol);
    }
    setIsOpen(false);
  };

  const handleDetachCommit = () => {
    onSelect(null);
    setDirection(-1);
    setTempSelectedSymbol(null);
    setView("search");
    setKeyword("");
    setIsOpen(false);
  };

  const hasChanges = useMemo(() => {
    return tempSelectedSymbol !== attachedStockSymbol;
  }, [tempSelectedSymbol, attachedStockSymbol]);

  const popoverWidth = isMobile ? 290 : view === "search" ? 320 : 480;

  return (
    <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger>
        <Button
          size="sm"
          variant={attachedStockSymbol ? "secondary" : "tertiary"}
          aria-label="Attach Stock"
          onPress={() => setIsOpen(true)}
        >
          <Icon icon="gravity-ui:chart-line" className="size-5" />
          <span>{attachedStockSymbol ? "Stock Attached" : "Stock"}</span>
        </Button>
      </Popover.Trigger>

      <Popover.Content className="w-fit overflow-hidden" placement="top">
        <Popover.Dialog className="flex min-h-75 flex-col gap-3 overflow-hidden">
          <motion.div
            animate={{ width: popoverWidth }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="flex h-full w-full flex-col gap-3"
          >
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {view === "search" ? (
                <motion.div
                  key="search-view"
                  custom={direction}
                  variants={viewVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex h-full w-full flex-col gap-3"
                >
                  <Popover.Heading>Attach Stock Trend</Popover.Heading>

                  <SearchField
                    name="search"
                    variant="secondary"
                    autoFocus
                    value={keyword}
                    onChange={setKeyword}
                    className="w-full"
                  >
                    <SearchField.Group>
                      <SearchField.SearchIcon>
                        {isFetching ? (
                          <Spinner size="sm" color="accent" />
                        ) : (
                          <Icon icon="gravity-ui:magnifier" />
                        )}
                      </SearchField.SearchIcon>
                      <SearchField.Input
                        placeholder="Search by name or code (e.g. 茅台)..."
                        autoFocus
                      />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>

                  <ScrollShadow hideScrollBar className="h-60 w-full overflow-y-auto" size={40}>
                    {keyword.trim().length === 0 ? (
                      <EmptyState>
                        <EmptyState.Header>
                          <EmptyState.Media variant="icon">
                            <Icon icon="gravity-ui:magnifier" />
                          </EmptyState.Media>
                          <EmptyState.Title>Type to search</EmptyState.Title>
                          <EmptyState.Description>Enter stock name or code</EmptyState.Description>
                        </EmptyState.Header>
                      </EmptyState>
                    ) : isFetching && stocks.length === 0 ? (
                      <Spinner size="sm" color="accent" />
                    ) : stocks.length > 0 ? (
                      <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: 50 }}>
                        <ListBox
                          aria-label="Stock Search Results"
                          selectionMode="none"
                          onAction={(key) => handleSelectFromSearch(String(key))}
                          items={stocks}
                        >
                          {(stock) => (
                            <ListBox.Item id={stock.symbol} textValue={stock.name}>
                              <div className="flex flex-col">
                                <Label>{stock.name}</Label>
                                <Description>{stock.symbol}</Description>
                              </div>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          )}
                        </ListBox>
                      </Virtualizer>
                    ) : (
                      <EmptyState>
                        <EmptyState.Header>
                          <EmptyState.Media variant="icon">
                            <Icon icon="gravity-ui:circle-info" />
                          </EmptyState.Media>
                          <EmptyState.Title>No stocks matched</EmptyState.Title>
                          <EmptyState.Description>
                            Try searching for another keyword or code
                          </EmptyState.Description>
                        </EmptyState.Header>
                      </EmptyState>
                    )}
                  </ScrollShadow>
                </motion.div>
              ) : (
                <motion.div
                  key="preview-view"
                  custom={direction}
                  variants={viewVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex h-full w-full flex-col gap-3.5"
                >
                  <Popover.Heading className="flex flex-row items-center gap-2">
                    <Icon icon="gravity-ui:chart-mixed" />
                    <span>Interactive Preview</span>
                  </Popover.Heading>

                  {tempSelectedSymbol && (
                    <StockTrendCard
                      symbol={tempSelectedSymbol}
                      variant="transparent"
                      className="w-full p-0"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="ghost" onPress={handleGoBackToSearch}>
                      <Icon icon="gravity-ui:arrow-left" className="size-3.5" />
                      <span>Search</span>
                    </Button>

                    <div className="flex items-center gap-1.5">
                      {attachedStockSymbol === tempSelectedSymbol && (
                        <Button size="sm" variant="danger-soft" onPress={handleDetachCommit}>
                          <Icon icon="gravity-ui:trash-bin" className="size-3.5" />
                          <span>Detach</span>
                        </Button>
                      )}
                      {hasChanges && (
                        <Button size="sm" variant="primary" onPress={handleAttachCommit}>
                          <Icon icon="gravity-ui:check" className="size-3.5" />
                          <span>Attach</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
