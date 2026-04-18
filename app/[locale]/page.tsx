"use client";

import { Plate, PlateContent } from "platejs/react";
import { useRichText } from "@/hooks/use-rich-text";
import { initialValue } from "./value";
import { Button, Modal, Card, Chip, cn, ScrollShadow } from "@heroui/react";
import { useTranslations } from "next-intl";
import { insertColumnGroup } from "@platejs/layout";
import { motion } from "motion/react";
import { Background } from "@/components/background";
import { ArrowRight, PencilToSquare, Palette, Rocket, LogoGithub } from "@gravity-ui/icons";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function Home() {
  const t = useTranslations("HomePage");
  const { editor } = useRichText({ value: initialValue });

  if (!editor) {
    return null;
  }

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-start pt-16 pb-24 md:pt-32 overflow-hidden">
      <Background />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex w-full flex-col items-center"
      >
        {/* Hero Section */}
        <section className="flex w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
          <motion.div variants={itemVariants}>
            <Chip
              variant="secondary"
              color="accent"
              size="sm"
              className="mb-8 font-bold tracking-widest uppercase bg-accent/10 border-accent/20"
            >
              {t("badge")}
            </Chip>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-8 text-6xl font-black tracking-tighter sm:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-muted mx-auto mb-12 max-w-2xl text-lg leading-relaxed sm:text-xl font-medium"
          >
            {t("heroSubtitle")}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 sm:flex-row">
            <Modal>
              <Button size="lg" color="accent" className="h-14 px-8 text-base font-bold shadow-xl shadow-accent/20 group">
                {t("openEditor")}
                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Modal.Backdrop variant="blur">
                <Modal.Container size="cover">
                  <Modal.Dialog className="bg-background/80 backdrop-blur-2xl">
                    <Modal.Header className="border-b border-border/50 px-8 py-6">
                      <div className="flex w-full items-center justify-between">
                        <div>
                          <Modal.Heading className="text-2xl font-black tracking-tight">Odyssey Editor</Modal.Heading>
                          <p className="text-muted text-sm font-medium">Craft your story with power.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="font-bold uppercase tracking-wider"
                            onPress={() => insertColumnGroup(editor, { columns: 3, select: true })}
                          >
                            Add Columns
                          </Button>
                          <Modal.CloseTrigger
                            render={(props) => (
                              <Button
                                {...props}
                                size="sm"
                                variant="ghost"
                                className="font-bold uppercase"
                              >
                                Close
                              </Button>
                            )}
                          />
                        </div>
                      </div>
                    </Modal.Header>
                    <Modal.Body className="p-0 overflow-hidden">
                      <ScrollShadow className="mx-auto w-full max-w-5xl px-8 py-12 h-[80vh]">
                        <Plate editor={editor}>
                          <PlateContent
                            className="min-h-full text-lg outline-none selection:bg-accent/20"
                            placeholder="Type your amazing content here..."
                          />
                        </Plate>
                      </ScrollShadow>
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>

            <Button
              size="lg"
              variant="secondary"
              className="h-14 px-8 text-base font-bold bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md"
              onPress={() => window.open("https://github.com/heroui-inc/heroui", "_blank")}
            >
              <LogoGithub className="mr-2 size-5" />
              {t("viewGithub")}
            </Button>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="mt-40 flex w-full max-w-6xl flex-col items-center px-6">
          <motion.h2
            variants={itemVariants}
            className="mb-16 text-4xl font-black tracking-tight sm:text-5xl"
          >
            {t("featuresTitle")}
          </motion.h2>

          <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: t("feature1Title"),
                desc: t("feature1Desc"),
                icon: PencilToSquare,
                color: "accent",
              },
              {
                title: t("feature2Title"),
                desc: t("feature2Desc"),
                icon: Palette,
                color: "success",
              },
              {
                title: t("feature3Title"),
                desc: t("feature3Desc"),
                icon: Rocket,
                color: "warning",
              },
            ].map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card
                  variant="secondary"
                  className="group relative h-full overflow-hidden border-border/50 bg-surface/30 p-8 backdrop-blur-md transition-all hover:-translate-y-2 hover:bg-surface/50 hover:shadow-2xl hover:shadow-accent/5"
                >
                  <div className={cn(
                    "mb-6 flex size-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3",
                    feature.color === "accent" ? "bg-accent/10 text-accent" :
                    feature.color === "success" ? "bg-success/10 text-success" :
                    "bg-warning/10 text-warning"
                  )}>
                    <feature.icon className="size-7" />
                  </div>
                  <h3 className="mb-4 text-2xl font-black tracking-tight">{feature.title}</h3>
                  <p className="text-muted text-lg font-medium leading-relaxed">
                    {feature.desc}
                  </p>
                  <div className="absolute -right-8 -bottom-8 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]">
                    <feature.icon className="size-40" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
