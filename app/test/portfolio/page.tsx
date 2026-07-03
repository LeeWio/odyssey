"use client";

import { useMemo, useState, FormEvent, useEffect } from "react";
import {
  Button,
  Form,
  TextField,
  Label,
  Input,
  TextArea,
  FieldError,
  Modal,
  AlertDialog,
  SearchField,
  Chip,
  Tabs,
  Select,
  ListBox,
  Switch,
  toast,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { Pencil, TrashBin, CirclePlus } from "@gravity-ui/icons";

// ==========================================
// --- MOCK DATA SPECIFICATIONS ---
// ==========================================

const INITIAL_TRANSACTIONS = [
  {
    id: 1,
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    action: "BUY" as const,
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
    action: "SELL" as const,
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
    action: "BUY" as const,
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
    action: "BUY" as const,
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
    action: "BUY" as const,
    roi: "+11.2%",
    shares: "150 Shrs",
    price: "$72.40",
    statusText: "Holding",
    isHolding: true,
    gradient: "from-amber-600 via-amber-500 to-yellow-400",
  },
];

const INITIAL_KPIS = [
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

const INITIAL_RULES = [
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

const INITIAL_THESIS =
  "Holding a cash buffer and scaling down high-beta tech exposure. Waiting for better entry points in index ETFs during range-bound tech consolidation.";

export default function PortfolioTestPage() {
  const [activeTab, setActiveTab] = useState<string>("transactions");

  // --- Client-Side States ---
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [kpis, setKpis] = useState(INITIAL_KPIS);
  const [rules, setRules] = useState(INITIAL_RULES);
  const [thesisText, setThesisText] = useState(INITIAL_THESIS);

  // Load from localStorage on mount (prevents SSR hydration error and synchronous cascading effect state update)
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
        if (storedThesis) setThesisText(storedThesis);
      };
      setTimeout(loadData, 0);
    }
  }, []);

  // Save to localStorage helpers
  const saveTxToLocalStorage = (data: typeof INITIAL_TRANSACTIONS) => {
    localStorage.setItem("odyssey_portfolio_transactions", JSON.stringify(data));
  };

  const saveKpisToLocalStorage = (data: typeof INITIAL_KPIS) => {
    localStorage.setItem("odyssey_portfolio_kpis", JSON.stringify(data));
  };

  const saveRulesToLocalStorage = (data: typeof INITIAL_RULES) => {
    localStorage.setItem("odyssey_portfolio_rules", JSON.stringify(data));
  };

  const saveThesisToLocalStorage = (text: string) => {
    localStorage.setItem("odyssey_portfolio_thesis", text);
  };

  // ==========================================
  // 1. TRANSACTIONS SECTION STATE & LOGIC
  // ==========================================
  const [txSearch, setTxSearch] = useState("");
  const [txSortDescriptor, setTxSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "id",
    direction: "ascending",
  });
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isTxDeleteAlertOpen, setIsTxDeleteAlertOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<(typeof INITIAL_TRANSACTIONS)[0] | null>(null);

  // Form states for Transaction
  const [txTicker, setTxTicker] = useState("");
  const [txCompanyName, setTxCompanyName] = useState("");
  const [txAction, setTxAction] = useState<"BUY" | "SELL">("BUY");
  const [txRoi, setTxRoi] = useState("");
  const [txShares, setTxShares] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txStatusText, setTxStatusText] = useState("");
  const [txIsHolding, setTxIsHolding] = useState(true);
  const [txGradient, setTxGradient] = useState("");

  const handleTxCreateOpen = () => {
    setSelectedTx(null);
    setTxTicker("");
    setTxCompanyName("");
    setTxAction("BUY");
    setTxRoi("+0.0%");
    setTxShares("100 Shrs");
    setTxPrice("$100.00");
    setTxStatusText("Holding");
    setTxIsHolding(true);
    setTxGradient("from-emerald-600 via-emerald-500 to-teal-400");
    setIsTxModalOpen(true);
  };

  const handleTxEditOpen = (tx: (typeof INITIAL_TRANSACTIONS)[0]) => {
    setSelectedTx(tx);
    setTxTicker(tx.ticker);
    setTxCompanyName(tx.companyName);
    setTxAction(tx.action);
    setTxRoi(tx.roi);
    setTxShares(tx.shares);
    setTxPrice(tx.price);
    setTxStatusText(tx.statusText);
    setTxIsHolding(tx.isHolding);
    setTxGradient(tx.gradient || "");
    setIsTxModalOpen(true);
  };

  const handleTxDeleteOpen = (tx: (typeof INITIAL_TRANSACTIONS)[0]) => {
    setSelectedTx(tx);
    setIsTxDeleteAlertOpen(true);
  };

  const handleTxSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      ticker: txTicker.trim().toUpperCase(),
      companyName: txCompanyName.trim(),
      action: txAction,
      roi: txRoi.trim(),
      shares: txShares.trim(),
      price: txPrice.trim(),
      statusText: txStatusText.trim(),
      isHolding: txIsHolding,
      gradient: txGradient.trim() || "from-emerald-600 via-emerald-500 to-teal-400",
    };

    let updatedTx;
    if (selectedTx) {
      updatedTx = transactions.map((t) => (t.id === selectedTx.id ? { ...t, ...payload } : t));
      toast.success(`Position ${payload.ticker} updated successfully! (Saved)`);
    } else {
      const newId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1;
      updatedTx = [...transactions, { id: newId, ...payload }];
      toast.success(`Position ${payload.ticker} added successfully! (Saved)`);
    }
    setTransactions(updatedTx);
    saveTxToLocalStorage(updatedTx);
    setIsTxModalOpen(false);
  };

  const handleTxDeleteConfirm = () => {
    if (!selectedTx) return;
    const updatedTx = transactions.filter((t) => t.id !== selectedTx.id);
    setTransactions(updatedTx);
    saveTxToLocalStorage(updatedTx);
    toast.success(`Position ${selectedTx.ticker} deleted successfully!`);
    setIsTxDeleteAlertOpen(false);
  };

  const filteredTx = useMemo(() => {
    let res = [...transactions];
    if (txSearch) {
      const q = txSearch.toLowerCase();
      res = res.filter(
        (t) =>
          t.ticker.toLowerCase().includes(q) ||
          t.companyName.toLowerCase().includes(q) ||
          t.statusText.toLowerCase().includes(q)
      );
    }
    return res;
  }, [transactions, txSearch]);

  const sortedTx = useMemo(() => {
    if (!txSortDescriptor.column) return filteredTx;
    const col = txSortDescriptor.column as keyof (typeof INITIAL_TRANSACTIONS)[0];
    return [...filteredTx].sort((a, b) => {
      const first = a[col];
      const second = b[col];
      let cmp = 0;
      if (typeof first === "number" && typeof second === "number") {
        cmp = first - second;
      } else if (typeof first === "boolean" && typeof second === "boolean") {
        cmp = (first ? 1 : 0) - (second ? 1 : 0);
      } else {
        cmp = String(first ?? "").localeCompare(String(second ?? ""));
      }
      const dir = txSortDescriptor.direction === "descending" ? -1 : 1;
      return cmp * dir;
    });
  }, [filteredTx, txSortDescriptor]);

  const txColumns = useMemo<DataGridColumn<(typeof INITIAL_TRANSACTIONS)[0]>[]>(
    () => [
      {
        id: "ticker",
        header: "Ticker",
        accessorKey: "ticker",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 90,
        cell: (item) => (
          <div className="text-foreground flex items-center gap-2 font-bold">
            <span className="bg-default-100 rounded-lg px-2 py-0.5 text-xs uppercase">
              {item.ticker}
            </span>
          </div>
        ),
      },
      {
        id: "companyName",
        header: "Company",
        accessorKey: "companyName",
        allowsSorting: true,
        minWidth: 150,
      },
      {
        id: "action",
        header: "Action",
        accessorKey: "action",
        allowsSorting: true,
        minWidth: 80,
        cell: (item) => (
          <Chip color={item.action === "BUY" ? "success" : "accent"} size="sm" variant="soft">
            {item.action}
          </Chip>
        ),
      },
      {
        id: "shares",
        header: "Shares",
        accessorKey: "shares",
        minWidth: 90,
      },
      {
        id: "price",
        header: "Entry Price",
        accessorKey: "price",
        minWidth: 100,
      },
      {
        id: "roi",
        header: "ROI",
        accessorKey: "roi",
        allowsSorting: true,
        minWidth: 90,
        cell: (item) => {
          const isPos = !item.roi.startsWith("-");
          return (
            <span className={`font-mono font-bold ${isPos ? "text-success" : "text-danger"}`}>
              {item.roi}
            </span>
          );
        },
      },
      {
        id: "statusText",
        header: "Status",
        accessorKey: "statusText",
        minWidth: 100,
        cell: (item) => (
          <div className="flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${item.isHolding ? "bg-success" : "bg-default-400"}`}
            />
            <span className="text-sm">{item.statusText}</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "end",
        minWidth: 100,
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <Button isIconOnly size="sm" variant="tertiary" onPress={() => handleTxEditOpen(item)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="danger-soft"
              onPress={() => handleTxDeleteOpen(item)}
            >
              <TrashBin className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  // ==========================================
  // 2. KPIS SECTION STATE & LOGIC
  // ==========================================
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<(typeof INITIAL_KPIS)[0] | null>(null);
  const [kpiTitle, setKpiTitle] = useState("");
  const [kpiValue, setKpiValue] = useState("");
  const [kpiChange, setKpiChange] = useState("");
  const [kpiPercentage, setKpiPercentage] = useState("");
  const [kpiIsPositive, setKpiIsPositive] = useState(true);
  const [kpiDescription, setKpiDescription] = useState("");

  const handleKpiEditOpen = (kpi: (typeof INITIAL_KPIS)[0]) => {
    setSelectedKpi(kpi);
    setKpiTitle(kpi.title);
    setKpiValue(kpi.value);
    setKpiChange(kpi.change);
    setKpiPercentage(kpi.percentage);
    setKpiIsPositive(kpi.isPositive);
    setKpiDescription(kpi.description);
    setIsKpiModalOpen(true);
  };

  const handleKpiSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedKpi) return;
    const payload = {
      title: kpiTitle.trim(),
      value: kpiValue.trim(),
      change: kpiChange.trim(),
      percentage: kpiPercentage.trim(),
      isPositive: kpiIsPositive,
      description: kpiDescription.trim(),
    };

    const updatedKpis = kpis.map((k) => (k.id === selectedKpi.id ? { ...k, ...payload } : k));
    setKpis(updatedKpis);
    saveKpisToLocalStorage(updatedKpis);
    toast.success(`Metric "${payload.title}" updated successfully!`);
    setIsKpiModalOpen(false);
  };

  // ==========================================
  // 3. RULES SECTION STATE & LOGIC
  // ==========================================
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isRuleDeleteAlertOpen, setIsRuleDeleteAlertOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<(typeof INITIAL_RULES)[0] | null>(null);
  const [ruleText, setRuleText] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");

  const handleRuleCreateOpen = () => {
    setSelectedRule(null);
    setRuleText("");
    setRuleDesc("");
    setIsRuleModalOpen(true);
  };

  const handleRuleEditOpen = (ruleObj: (typeof INITIAL_RULES)[0]) => {
    setSelectedRule(ruleObj);
    setRuleText(ruleObj.rule);
    setRuleDesc(ruleObj.desc);
    setIsRuleModalOpen(true);
  };

  const handleRuleDeleteOpen = (ruleObj: (typeof INITIAL_RULES)[0]) => {
    setSelectedRule(ruleObj);
    setIsRuleDeleteAlertOpen(true);
  };

  const handleRuleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      rule: ruleText.trim(),
      desc: ruleDesc.trim(),
    };

    let updatedRules;
    if (selectedRule) {
      updatedRules = rules.map((r) => (r.id === selectedRule.id ? { ...r, ...payload } : r));
      toast.success(`Trading Guardrail updated!`);
    } else {
      const newId = rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 1 : 1;
      updatedRules = [...rules, { id: newId, ...payload }];
      toast.success(`Trading Guardrail created!`);
    }
    setRules(updatedRules);
    saveRulesToLocalStorage(updatedRules);
    setIsRuleModalOpen(false);
  };

  const handleRuleDeleteConfirm = () => {
    if (!selectedRule) return;
    const updatedRules = rules.filter((r) => r.id !== selectedRule.id);
    setRules(updatedRules);
    saveRulesToLocalStorage(updatedRules);
    toast.success(`Trading Guardrail deleted!`);
    setIsRuleDeleteAlertOpen(false);
  };

  // ==========================================
  // 4. THESIS SECTION STATE & LOGIC
  // ==========================================
  const handleThesisSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveThesisToLocalStorage(thesisText);
    toast.success("Market macro thesis note saved successfully!");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      {/* Page Header */}
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          Stock & Portfolio Management
        </h1>
        <p className="text-muted mt-1 text-sm">
          Manage your personal transactions, performance metrics, trading rules, and thesis.
          (Changes sync instantly to home page)
        </p>
      </div>

      {/* Tabs Layout with HeroUI V3 Dot API */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Portfolio Management Options">
            <Tabs.Tab id="transactions">
              Transactions
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="kpis">
              Portfolio KPIs
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="rules">
              Trading Guardrails
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="thesis">
              Market Thesis
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="transactions">
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SearchField
                className="w-full sm:w-[280px]"
                name="tx-search"
                onChange={setTxSearch}
                value={txSearch}
              >
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Search transactions..." />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>

              <Button size="md" onPress={handleTxCreateOpen}>
                <CirclePlus className="size-4" />
                Add Transaction
              </Button>
            </div>

            <div className="bg-surface border-border overflow-hidden rounded-2xl border">
              <DataGrid
                aria-label="Transactions"
                columns={txColumns}
                data={sortedTx}
                getRowId={(item) => item.id}
                sortDescriptor={txSortDescriptor}
                onSortChange={setTxSortDescriptor}
              />
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="kpis">
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {kpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className="border-border/60 bg-surface/50 flex flex-col justify-between rounded-2xl border p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-muted text-[10px] font-bold tracking-wider uppercase">
                      {kpi.title}
                    </span>
                    <span className="text-foreground font-mono text-2xl font-extrabold tracking-tight">
                      {kpi.value}
                    </span>
                    <p className="text-muted mt-1 text-xs leading-relaxed">{kpi.description}</p>
                  </div>
                  <div className="border-border/40 mt-4 flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted font-mono text-[10px]">{kpi.change}</span>
                      <Chip size="sm" variant="soft" color={kpi.isPositive ? "success" : "danger"}>
                        {kpi.percentage}
                      </Chip>
                    </div>
                    <Button size="sm" variant="tertiary" onPress={() => handleKpiEditOpen(kpi)}>
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="rules">
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-lg font-bold">Rule Setups</h2>
              <Button size="md" onPress={handleRuleCreateOpen}>
                <CirclePlus className="size-4" />
                Add Rule
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {rules.map((ruleObj) => (
                <div
                  key={ruleObj.id}
                  className="border-border/60 bg-surface flex items-start justify-between rounded-xl border p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="text-foreground text-sm font-bold tracking-tight">
                      {ruleObj.rule}
                    </h3>
                    <p className="text-muted text-xs leading-relaxed">{ruleObj.desc}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="tertiary"
                      onPress={() => handleRuleEditOpen(ruleObj)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="danger-soft"
                      onPress={() => handleRuleDeleteOpen(ruleObj)}
                    >
                      <TrashBin className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="thesis">
          <div className="mt-6 flex flex-col gap-4">
            <h2 className="text-foreground text-lg font-bold">Current Thesis Note</h2>
            <Form
              onSubmit={handleThesisSubmit}
              className="bg-surface border-border flex max-w-2xl flex-col gap-4 rounded-xl border p-6"
            >
              <TextField isRequired name="thesis">
                <Label className="text-sm font-medium">Thesis Content</Label>
                <TextArea
                  placeholder="Enter your active market macro thesis..."
                  className="min-h-32 text-sm leading-relaxed"
                  value={thesisText}
                  onChange={(e) => setThesisText(e.target.value)}
                />
                <FieldError />
              </TextField>
              <Button type="submit" size="md" className="w-fit">
                Save Thesis Note
              </Button>
            </Form>
          </div>
        </Tabs.Panel>
      </Tabs>

      {/* CREATE/EDIT TRANSACTION MODAL */}
      <Modal>
        <Modal.Backdrop isOpen={isTxModalOpen} onOpenChange={setIsTxModalOpen} variant="blur">
          <Modal.Container size="sm">
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Form onSubmit={handleTxSubmit}>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-bold">
                    {selectedTx ? "Edit Position" : "Add Position Snapshot"}
                  </Modal.Heading>
                  <p className="text-muted text-xs">
                    Record capital allocation and execution details. (Mock)
                  </p>
                </Modal.Header>

                <Modal.Body className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <TextField isRequired name="ticker">
                      <Label className="text-xs font-medium">Ticker Symbol</Label>
                      <Input
                        placeholder="e.g. NVDA"
                        value={txTicker}
                        onChange={(e) => setTxTicker(e.target.value)}
                      />
                      <FieldError />
                    </TextField>

                    <TextField isRequired name="companyName">
                      <Label className="text-xs font-medium">Company Name</Label>
                      <Input
                        placeholder="e.g. NVIDIA Corp."
                        value={txCompanyName}
                        onChange={(e) => setTxCompanyName(e.target.value)}
                      />
                      <FieldError />
                    </TextField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      placeholder="Select action"
                      value={txAction}
                      onChange={(val) => setTxAction(val as "BUY" | "SELL")}
                    >
                      <Label className="text-xs font-medium">Action</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="BUY" textValue="BUY">
                            BUY
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="SELL" textValue="SELL">
                            SELL
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>

                    <TextField isRequired name="roi">
                      <Label className="text-xs font-medium">Current ROI %</Label>
                      <Input
                        placeholder="e.g. +22.4%"
                        value={txRoi}
                        onChange={(e) => setTxRoi(e.target.value)}
                      />
                      <FieldError />
                    </TextField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <TextField isRequired name="shares">
                      <Label className="text-xs font-medium">Shares Size</Label>
                      <Input
                        placeholder="e.g. 120 Shrs"
                        value={txShares}
                        onChange={(e) => setTxShares(e.target.value)}
                      />
                      <FieldError />
                    </TextField>

                    <TextField isRequired name="price">
                      <Label className="text-xs font-medium">Entry / Execution Price</Label>
                      <Input
                        placeholder="e.g. $118.50"
                        value={txPrice}
                        onChange={(e) => setTxPrice(e.target.value)}
                      />
                      <FieldError />
                    </TextField>
                  </div>

                  <TextField isRequired name="statusText">
                    <Label className="text-xs font-medium">Status Description</Label>
                    <Input
                      placeholder="e.g. Holding"
                      value={txStatusText}
                      onChange={(e) => setTxStatusText(e.target.value)}
                    />
                    <FieldError />
                  </TextField>

                  <div className="border-border/40 bg-default-50/5 flex items-center justify-between rounded-xl border p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">Active Holding Status</span>
                      <span className="text-muted text-[10px]">
                        Whether you currently hold this position or closed it out.
                      </span>
                    </div>
                    <Switch isSelected={txIsHolding} onChange={setTxIsHolding} />
                  </div>

                  <TextField name="gradient">
                    <Label className="text-xs font-medium">Holographic Background Gradient</Label>
                    <Input
                      placeholder="Tailwind from-to classes"
                      value={txGradient}
                      onChange={(e) => setTxGradient(e.target.value)}
                    />
                    <FieldError />
                  </TextField>
                </Modal.Body>

                <Modal.Footer className="border-border border-t pt-4">
                  <Button slot="close" variant="tertiary" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* TRANSACTION DELETE ALERT */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isTxDeleteAlertOpen}
          onOpenChange={setIsTxDeleteAlertOpen}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Position Snapshot?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Are you sure you want to delete the transaction record for{" "}
                  <strong className="text-foreground">{selectedTx?.ticker}</strong>?
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" size="sm">
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onPress={handleTxDeleteConfirm}>
                  Delete
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      {/* EDIT KPI MODAL */}
      <Modal>
        <Modal.Backdrop isOpen={isKpiModalOpen} onOpenChange={setIsKpiModalOpen} variant="blur">
          <Modal.Container size="sm">
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Form onSubmit={handleKpiSubmit}>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-bold">Edit Metric KPI</Modal.Heading>
                  <p className="text-muted text-xs">
                    Update your combined capital reserves or performance ratios. (Mock)
                  </p>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4 py-4">
                  <TextField isRequired name="title">
                    <Label className="text-xs font-medium">Metric Title</Label>
                    <Input value={kpiTitle} onChange={(e) => setKpiTitle(e.target.value)} />
                    <FieldError />
                  </TextField>

                  <TextField isRequired name="value">
                    <Label className="text-xs font-medium">Net Allocation Value</Label>
                    <Input value={kpiValue} onChange={(e) => setKpiValue(e.target.value)} />
                    <FieldError />
                  </TextField>

                  <div className="grid grid-cols-2 gap-4">
                    <TextField isRequired name="change">
                      <Label className="text-xs font-medium">Performance Change Text</Label>
                      <Input value={kpiChange} onChange={(e) => setKpiChange(e.target.value)} />
                      <FieldError />
                    </TextField>

                    <TextField isRequired name="percentage">
                      <Label className="text-xs font-medium">Percentage Performance</Label>
                      <Input
                        value={kpiPercentage}
                        onChange={(e) => setKpiPercentage(e.target.value)}
                      />
                      <FieldError />
                    </TextField>
                  </div>

                  <div className="border-border/40 bg-default-50/5 flex items-center justify-between rounded-xl border p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">Positive Performance</span>
                      <span className="text-muted text-[10px]">
                        Whether the performance is showing structural green/gains.
                      </span>
                    </div>
                    <Switch isSelected={kpiIsPositive} onChange={setKpiIsPositive} />
                  </div>

                  <TextField isRequired name="description">
                    <Label className="text-xs font-medium">Description</Label>
                    <TextArea
                      value={kpiDescription}
                      onChange={(e) => setKpiDescription(e.target.value)}
                    />
                    <FieldError />
                  </TextField>
                </Modal.Body>
                <Modal.Footer className="border-border border-t pt-4">
                  <Button slot="close" variant="tertiary" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Changes
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* CREATE/EDIT RULE MODAL */}
      <Modal>
        <Modal.Backdrop isOpen={isRuleModalOpen} onOpenChange={setIsRuleModalOpen} variant="blur">
          <Modal.Container size="sm">
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Form onSubmit={handleRuleSubmit}>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-bold">
                    {selectedRule ? "Edit Guardrail Rule" : "Add Guardrail Rule"}
                  </Modal.Heading>
                  <p className="text-muted text-xs">
                    Define a strict quantitative guardrail to protect principal liquidity. (Mock)
                  </p>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4 py-4">
                  <TextField isRequired name="rule">
                    <Label className="text-sm font-medium">Trading Guardrail Rule</Label>
                    <Input
                      placeholder="e.g. Stop-loss logic"
                      value={ruleText}
                      onChange={(e) => setRuleText(e.target.value)}
                    />
                    <FieldError />
                  </TextField>

                  <TextField isRequired name="desc">
                    <Label className="text-sm font-medium">Description</Label>
                    <TextArea
                      placeholder="Explain the risk metrics..."
                      value={ruleDesc}
                      onChange={(e) => setRuleDesc(e.target.value)}
                    />
                    <FieldError />
                  </TextField>
                </Modal.Body>
                <Modal.Footer className="border-border border-t pt-4">
                  <Button slot="close" variant="tertiary" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* RULE DELETE ALERT */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isRuleDeleteAlertOpen}
          onOpenChange={setIsRuleDeleteAlertOpen}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Guardrail Rule?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Are you sure you want to delete the rule:{" "}
                  <strong className="text-foreground">{selectedRule?.rule}</strong>?
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" size="sm">
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onPress={handleRuleDeleteConfirm}>
                  Delete
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
