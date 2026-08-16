"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Card, Chip, Typography, Button } from "@heroui/react";
import { KPI } from "@heroui-pro/react/kpi";
import { DataGrid, type DataGridColumn } from "@heroui-pro/react";
import { Sparkles, Search, CheckCircle2, Cpu, Layout, FileCheck, UserCheck } from "lucide-react";

const easeOut = [0.22, 1, 0.36, 1] as const;

// Experience item structure for recruiters
type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  period: string;
  category: "systems" | "frontend" | "creative";
  achievements: string;
  impactMetric: string;
};

const EXPERIENCE_DATABASE: ExperienceItem[] = [
  {
    id: "exp-1",
    role: "Senior Embedded Engineer",
    company: "Automotive Core Systems",
    period: "2024 - Present",
    category: "systems",
    achievements:
      "Engineered strict QNX RTOS microkernel scheduling drivers, resolving 15+ complex priority inversion deadlock states in driver-level communication layers.",
    impactMetric: "<50ns Scheduler Latency",
  },
  {
    id: "exp-2",
    role: "Lead UI Architect & Design Systems",
    company: "Cinematic Web Products",
    period: "2022 - 2024",
    category: "frontend",
    achievements:
      "Developed an accessible, customized design system (1,500+ tokens) matching strict WCAG AAA guidelines, standardizing React layouts across 4 products.",
    impactMetric: "100% Lighthouse Score",
  },
  {
    id: "exp-3",
    role: "Compiler Hacking Contributor",
    company: "Open Source Rust Labs",
    period: "2021 - 2022",
    category: "systems",
    achievements:
      "Refactored lexical parsers and recursive syntax trees, shrinking build artifact footprints and introducing safe asynchronous parallel compilations.",
    impactMetric: "-35% Binary Footprint",
  },
  {
    id: "exp-4",
    role: "Visual Designer & Audio Specialist",
    company: "Analogue Modular Sounds",
    period: "2020 - 2021",
    category: "creative",
    achievements:
      "Engineered web-based polyphonic additive modular synthesizer layouts and developed custom photographic galleries for medium format film showcases.",
    impactMetric: "12k+ Active Listeners",
  },
];

type HiringProfile = "systems" | "frontend" | "creative";

export function RecruiterPage() {
  const [profile, setProfile] = useState<HiringProfile>("systems");
  const [searchQuery, setSearchQuery] = useState("");

  // Define KPI metrics dynamically based on the selected recruiter scenario
  const kpis = useMemo(() => {
    switch (profile) {
      case "systems":
        return [
          {
            title: "Priority Inversions Solved",
            value: 15,
            trend: "up",
            change: "Resolved Deadlocks",
            status: "success" as const,
            progress: 100,
          },
          {
            title: "QNX Task Latency",
            value: 50,
            trend: "down",
            change: "Reduced Latency",
            status: "success" as const,
            progress: 95,
          },
          {
            title: "Binary Footprint Saved",
            value: 35,
            trend: "down",
            change: "-128 KB Optimized",
            status: "success" as const,
            progress: 85,
          },
        ];
      case "frontend":
        return [
          {
            title: "Accessibility (WCAG) Compliance",
            value: 100,
            trend: "up",
            change: "AAA Certified",
            status: "success" as const,
            progress: 100,
          },
          {
            title: "Design Tokens Managed",
            value: 1500,
            trend: "up",
            change: "+400 standard cards",
            status: "success" as const,
            progress: 90,
          },
          {
            title: "Lighthouse Performance",
            value: 100,
            trend: "up",
            change: "Turbopack Bundled",
            status: "success" as const,
            progress: 100,
          },
        ];
      case "creative":
        return [
          {
            title: "Active Audio Listeners",
            value: 12000,
            trend: "up",
            change: "Modular Synth Focus",
            status: "success" as const,
            progress: 80,
          },
          {
            title: "Film Frames Developed",
            value: 4000,
            trend: "up",
            change: "Medium Format Portra",
            status: "success" as const,
            progress: 75,
          },
          {
            title: "Open Source Commits",
            value: 450,
            trend: "neutral",
            change: "Rust & NextJS",
            status: "success" as const,
            progress: 92,
          },
        ];
    }
  }, [profile]);

  // Compatibility Fit details based on scenario
  const fitAssessment = useMemo(() => {
    switch (profile) {
      case "systems":
        return {
          score: 98,
          assessment:
            "Excellent fit for embedded or OS kernel level roles. Deep expertise in Microkernel scheduling (QNX), priorities, Rust parsers, and performance profiling.",
          highlight: "Highest compatibility under critical real-time performance guidelines.",
        };
      case "frontend":
        return {
          score: 96,
          assessment:
            "Superior candidate for visual product engineering and design-system scaling. Heavy focus on React Aria, accessible WCAG landmarks, and fluid spring layouts.",
          highlight:
            "Perfect alignment for complex dashboard systems requiring both engineering depth and pixel perfection.",
        };
      case "creative":
        return {
          score: 92,
          assessment:
            "A unique creative technologist who merges low-level audio engineering (synthesizers) with analogue deliberate composition and narrative design.",
          highlight:
            "Strong asset for early stage product ideation, research R&D, and custom spatial audio portals.",
        };
    }
  }, [profile]);

  // Column definitions for the interactive work-experience DataGrid
  const columns: DataGridColumn<ExperienceItem>[] = [
    {
      id: "role",
      header: "Role / Milestone",
      accessorKey: "role",
      minWidth: 180,
      allowsSorting: true,
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-bold">{item.role}</span>
          <span className="text-muted/60 font-mono text-xs">{item.company}</span>
        </div>
      ),
    },
    {
      id: "period",
      header: "Timeline",
      accessorKey: "period",
      minWidth: 100,
      allowsSorting: true,
      cellClassName: "text-xs font-mono font-medium text-muted/60",
    },
    {
      id: "achievements",
      header: "Practical Achievements",
      accessorKey: "achievements",
      minWidth: 320,
      cell: (item) => (
        <span className="text-foreground/80 block max-w-xl text-xs leading-relaxed">
          {item.achievements}
        </span>
      ),
    },
    {
      id: "impactMetric",
      header: "Core Impact",
      accessorKey: "impactMetric",
      minWidth: 150,
      align: "end",
      cell: (item) => (
        <Chip size="sm" variant="soft" color={item.category === profile ? "success" : "default"}>
          <span className="font-mono text-xs font-bold">{item.impactMetric}</span>
        </Chip>
      ),
    },
  ];

  // Filter experience rows dynamically based on the recruiter's search query and selection
  const filteredData = useMemo(() => {
    return EXPERIENCE_DATABASE.filter((item) => {
      const matchQuery =
        item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.achievements.toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [searchQuery]);

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
            <UserCheck className="text-accent size-3" />
            Recruiter Assessment Sandbox
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-4xl leading-tight text-balance sm:text-5xl"
          >
            Tailor-Fit Candidate Evaluator
          </Typography>
          <Typography color="muted" type="body" className="mt-4 max-w-xl leading-relaxed">
            Select your specific hiring requirements below to calculate alignment scores, reveal
            profile metrics, and filter practical milestones.
          </Typography>
        </motion.header>

        {/* Profile Selector tabs */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="sm"
            variant={profile === "systems" ? "primary" : "outline"}
            onPress={() => setProfile("systems")}
            className="shrink-0 gap-2"
          >
            <Cpu className="size-4" />
            Systems & Kernel Engineer
          </Button>
          <Button
            size="sm"
            variant={profile === "frontend" ? "primary" : "outline"}
            onPress={() => setProfile("frontend")}
            className="shrink-0 gap-2"
          >
            <Layout className="size-4" />
            UI & Design Systems Engineer
          </Button>
          <Button
            size="sm"
            variant={profile === "creative" ? "primary" : "outline"}
            onPress={() => setProfile("creative")}
            className="shrink-0 gap-2"
          >
            <Sparkles className="size-4" />
            Creative Tech Polymath
          </Button>
        </div>

        {/* Compatibility and Match Dashboard Panel */}
        <div className="mb-10 grid items-stretch gap-6 md:grid-cols-12">
          {/* Fit score Card */}
          <Card
            variant="secondary"
            className="border-default-200/50 bg-accent/5 flex flex-col justify-between rounded-2xl border p-6 md:col-span-4"
          >
            <div>
              <span className="text-muted/60 mb-2 block font-mono text-[9px] font-bold tracking-wider uppercase">
                COMPATIBILITY INDEX
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-accent font-mono text-5xl font-black">
                  {fitAssessment.score}%
                </span>
                <span className="text-muted/60 font-mono text-xs">MATCH</span>
              </div>
            </div>

            <div className="border-default-200 mt-4 border-t border-dashed pt-4">
              <Typography
                type="body-sm"
                weight="semibold"
                className="text-foreground flex items-center gap-1.5 text-xs"
              >
                <FileCheck className="text-accent size-4" />
                Scenario Highlights:
              </Typography>
              <Typography color="muted" type="body-xs" className="mt-2 leading-relaxed">
                {fitAssessment.highlight}
              </Typography>
            </div>
          </Card>

          {/* Detailed Alignment Assessment Report */}
          <Card
            variant="secondary"
            className="border-default-200/50 bg-surface-secondary/20 flex flex-col justify-between rounded-2xl border p-6 shadow-sm md:col-span-8"
          >
            <div>
              <span className="text-muted/60 mb-2 block font-mono text-[9px] font-bold tracking-wider uppercase">
                CANDIDATE FIT ASSESSMENT REPORT
              </span>
              <Typography type="h4" weight="bold">
                {profile === "systems"
                  ? "Embedded OS Kernel Scheduling & Priority Safety"
                  : profile === "frontend"
                    ? "Accessible Design Token Systems & High Performance Web"
                    : "Analogue Aesthetics & Synthesizer Mechanics"}
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-3 text-sm leading-relaxed">
                {fitAssessment.assessment}
              </Typography>
            </div>

            <div className="border-default-100/60 text-muted/50 mt-5 flex items-center gap-2 border-t pt-4 font-mono text-[11px] font-semibold uppercase">
              <CheckCircle2 className="text-success size-3.5 shrink-0" />
              Pre-Vetted Experience verified via Local Code commits
            </div>
          </Card>
        </div>

        {/* KPI Metrics Dashboard Row */}
        <div className="mb-10">
          <span className="text-muted/60 mb-4 block font-mono text-[9px] font-bold tracking-wider uppercase">
            SELECTED METRICS TELEMETRY
          </span>
          <div className="grid gap-4 sm:grid-cols-3">
            {kpis.map((kpi) => (
              <KPI
                key={kpi.title}
                className="bg-surface-secondary/20 border-default-200/50 rounded-2xl border p-5"
              >
                <KPI.Header>
                  <KPI.Title className="text-muted/80 text-xs font-semibold">{kpi.title}</KPI.Title>
                </KPI.Header>
                <KPI.Content className="mt-3 items-end gap-1">
                  <KPI.Value
                    className="font-mono leading-none font-black tabular-nums"
                    value={kpi.value}
                    currency={kpi.title.includes("Revenue") ? "USD" : undefined}
                    style={
                      kpi.title.includes("Compliance") || kpi.title.includes("Footprint")
                        ? "percent"
                        : "decimal"
                    }
                    maximumFractionDigits={0}
                  />
                  <div className="text-muted/60 mt-1 font-mono text-[10px] font-medium">
                    {kpi.change}
                  </div>
                </KPI.Content>
                <KPI.Progress className="mt-4" value={kpi.progress} status={kpi.status} />
              </KPI>
            ))}
          </div>
        </div>

        {/* Interactive Experience Registry Search Panel */}
        <div>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-muted/60 block font-mono text-[9px] font-bold tracking-wider uppercase">
                PRACTICAL EXPERIENCE REGISTRY
              </span>
            </div>

            {/* Search Input bar */}
            <div className="relative flex w-full max-w-xs shrink-0 items-center">
              <Search className="text-muted/40 pointer-events-none absolute left-3 size-4" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-default-200/60 bg-surface-secondary/40 focus:border-accent/40 w-full rounded-xl border py-2 pr-4 pl-9 font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Experience registry DataGrid */}
          <div className="border-default-200/50 bg-surface-secondary/10 overflow-hidden rounded-2xl border p-2 shadow-sm">
            <DataGrid
              aria-label="Experience achievements grid"
              data={filteredData}
              getRowId={(item) => item.id}
              columns={columns}
              allowsColumnResize
              className="text-foreground text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
