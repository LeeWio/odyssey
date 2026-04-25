"use client";

import React from "react";
import { motion } from "motion/react";
import { 
  Button, 
  Card, 
  Chip, 
  Avatar, 
  ProgressCircle,
  Separator
} from "@heroui/react";
import { Playfair_Display } from "next/font/google";
import { Icon } from "@iconify/react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { x: -40, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function Home() {
  return (
    <div className="bg-background text-foreground relative min-h-screen w-full font-sans selection:bg-primary/20">
      
      {/* Background ambient glow - typical in modern UI to give depth without overwhelming */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 opacity-50 blur-[120px] mix-blend-screen" />
        <div className="absolute right-[-5%] top-[20%] h-[500px] w-[500px] rounded-full bg-secondary/5 opacity-50 blur-[100px] mix-blend-screen" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-6 pt-32 pb-24 md:px-12">
        
        {/* --- HERO SECTION --- */}
        <motion.div 
          className="flex flex-col items-center text-center max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Chip 
              variant="secondary" 
              color="accent" 
              className="mb-8 border-default-200 bg-content1/50 backdrop-blur-md"
              size="sm"
            >
              <span className="font-semibold tracking-widest uppercase text-[10px]">Odyssey Framework</span>
            </Chip>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-[3.5rem] leading-[1.05] tracking-tight md:text-[5.5rem] lg:text-[6.5rem] font-extrabold text-foreground"
          >
            Don’t just do it — <br />
            <span className={`text-primary italic font-normal ${playfair.className}`}>
              do it well.
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-default-500 mt-8 max-w-2xl text-lg md:text-xl font-medium leading-relaxed"
          >
            We craft digital experiences that transcend the ordinary. Engineering robust, scalable, and meticulously detailed solutions.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Button 
              variant="primary"
              size="lg"
              className="w-full sm:w-auto font-bold tracking-wide px-8 shadow-xl shadow-foreground/10 bg-foreground text-background hover:bg-foreground/90 gap-2 flex items-center justify-center"
            >
              Explore Work
              <Icon icon="lucide:arrow-right" className="size-4" />
            </Button>
            <Button 
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto font-bold tracking-wide px-8 bg-default-100 hover:bg-default-200 text-foreground"
            >
              Read Philosophy
            </Button>
          </motion.div>
        </motion.div>

        <Separator className="my-24 w-full max-w-5xl opacity-50" />

        {/* --- BENTO GRID (Modern UI Showcase) --- */}
        <motion.div 
          className="grid w-full max-w-5xl grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Bento Item 1: Philosophy (Spans 2 columns) */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="h-full bg-content1/40 border border-default-200/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
              <Card.Content className="p-8 md:p-10 flex flex-col justify-center">
                <Icon icon="lucide:quote" className="size-8 text-primary/40 mb-6" />
                <p className={`text-foreground/80 text-xl md:text-2xl leading-relaxed ${playfair.className} italic mb-8`}>
                  &quot;Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="bg-default-200">
                    <Avatar.Image src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Aristotle" />
                    <Avatar.Fallback>AR</Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">Aristotle</span>
                    <span className="text-xs text-default-500">Ancient Greek Philosopher</span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Bento Item 2: Performance metrics */}
          <motion.div variants={itemVariants}>
            <Card className="h-full bg-content1/40 border border-default-200/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
              <Card.Header className="px-6 pt-6 pb-0 flex-col items-start">
                <div className="flex items-center gap-2 text-success">
                  <Icon icon="lucide:zap" className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Blazing Fast</span>
                </div>
                <h4 className="text-foreground text-lg font-bold mt-2">Performance</h4>
              </Card.Header>
              <Card.Content className="px-6 py-6 flex items-center justify-center">
                <div className="relative size-32 drop-shadow-md">
                  <ProgressCircle aria-label="Lighthouse Score" value={100} size="lg" color="success" className="size-full">
                    <ProgressCircle.Track>
                      <ProgressCircle.TrackCircle className="stroke-success/10 stroke-[3px]" />
                      <ProgressCircle.FillCircle className="stroke-success stroke-[3px]" />
                    </ProgressCircle.Track>
                  </ProgressCircle>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-foreground">
                    100
                  </div>
                </div>
              </Card.Content>
              <Card.Footer className="px-6 pb-6 pt-0">
                <p className="text-default-500 text-xs font-medium">Perfect 100 Lighthouse score. Sub-50ms latency across the globe.</p>
              </Card.Footer>
            </Card>
          </motion.div>

          {/* Bento Item 3: Scalability */}
          <motion.div variants={itemVariants}>
            <Card className="h-full bg-content1/40 border border-default-200/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
              <Card.Header className="px-6 pt-6 pb-0 flex-col items-start">
                <div className="flex items-center gap-2 text-secondary">
                  <Icon icon="lucide:globe-2" className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Global Edge</span>
                </div>
                <h4 className="text-foreground text-lg font-bold mt-2">Infinite Scale</h4>
              </Card.Header>
              <Card.Content className="px-6 py-6">
                <div className="flex flex-col gap-4">
                  <div className="bg-default-100 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-default-600 text-sm font-semibold">Uptime</span>
                    <Chip color="success" variant="soft" size="sm">99.99%</Chip>
                  </div>
                  <div className="bg-default-100 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-default-600 text-sm font-semibold">Regions</span>
                    <span className="text-foreground font-bold">35+</span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Bento Item 4: Ecosystem/Lifestyle (Spans 2 columns) */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="h-full bg-content1/40 border border-default-200/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
              <Card.Header className="px-8 pt-8 pb-0">
                <div className="flex items-center gap-2 text-primary">
                  <Icon icon="lucide:blocks" className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Ecosystem</span>
                </div>
              </Card.Header>
              <Card.Content className="px-8 py-8 flex flex-row flex-wrap items-center justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <h4 className="text-foreground text-xl font-bold">Seamless Integration</h4>
                  <p className="text-default-500 text-sm max-w-sm">Built for modern lifestyles and workflows. Connects natively with the tools you love.</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Chip variant="secondary" size="lg" className="px-2 pl-3">
                    <span className="flex items-center">
                      <Icon icon="lucide:dumbbell" className="size-4 mr-2"/>
                      <span>Fitness</span>
                    </span>
                  </Chip>
                  <Chip variant="secondary" size="lg" className="px-2 pl-3">
                    <span className="flex items-center">
                      <Icon icon="lucide:music" className="size-4 mr-2"/>
                      <span>Music</span>
                    </span>
                  </Chip>
                  <Chip variant="secondary" size="lg" className="px-2 pl-3">
                    <span className="flex items-center">
                      <Icon icon="lucide:gamepad-2" className="size-4 mr-2"/>
                      <span>Gaming</span>
                    </span>
                  </Chip>
                  <Chip variant="secondary" size="lg" className="px-2 pl-3">
                    <span className="flex items-center">
                      <Icon icon="lucide:code-2" className="size-4 mr-2"/>
                      <span>Coding</span>
                    </span>
                  </Chip>
                </div>
              </Card.Content>
            </Card>
          </motion.div>

        </motion.div>

      </main>
    </div>
  );
}
