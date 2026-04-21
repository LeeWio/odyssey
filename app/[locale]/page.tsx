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
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
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
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-start overflow-hidden pt-20 pb-24 md:pt-32">
      <Background />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex w-full flex-col items-center"
      >
        {/* Hero Section */}
        <section className="flex w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
          <motion.div variants={itemVariants}>
            <Chip
              variant="flat"
              color="primary"
              size="sm"
              className="bg-primary/10 text-primary border-primary/20 mb-8 px-3 py-4 font-medium tracking-wide backdrop-blur-md"
            >
              ✨ {t("badge")}
            </Chip>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="from-foreground via-foreground/90 to-foreground/40 mb-8 max-w-4xl bg-gradient-to-br bg-clip-text text-5xl font-extrabold tracking-tight text-transparent drop-shadow-sm sm:text-7xl lg:text-8xl"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-foreground/60 mx-auto mb-12 max-w-2xl text-lg leading-relaxed font-medium sm:text-xl"
          >
            {t("heroSubtitle")}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
          >
            <Modal>
              <Button
                size="lg"
                color="primary"
                className="shadow-primary/30 group hover:shadow-primary/40 h-14 px-8 text-base font-bold shadow-2xl transition-all hover:scale-105"
              >
                {t("openEditor")}
                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Modal.Backdrop variant="blur" className="bg-background/40 backdrop-blur-md">
                <Modal.Container
                  size="cover"
                  className="flex items-center justify-center p-4 sm:p-8"
                >
                  <Modal.Dialog className="bg-background/80 max-h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl backdrop-blur-3xl">
                    <Modal.Header className="border-b border-white/10 bg-white/5 px-6 py-4">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2 pl-1">
                            <div className="bg-danger/90 size-3.5 rounded-full shadow-sm" />
                            <div className="bg-warning/90 size-3.5 rounded-full shadow-sm" />
                            <div className="bg-success/90 size-3.5 rounded-full shadow-sm" />
                          </div>
                          <Modal.Heading className="text-foreground/80 ml-2 text-sm font-semibold tracking-wide">
                            Odyssey Editor
                          </Modal.Heading>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="font-semibold"
                            onPress={() => insertColumnGroup(editor, { columns: 3, select: true })}
                          >
                            Add Columns
                          </Button>
                          <Modal.CloseTrigger
                            render={(props) => (
                              <Button
                                {...props}
                                size="sm"
                                variant="light"
                                className="text-foreground/60 hover:text-foreground font-semibold"
                              >
                                Close
                              </Button>
                            )}
                          />
                        </div>
                      </div>
                    </Modal.Header>
                    <Modal.Body className="bg-background/50 p-0">
                      <ScrollShadow className="mx-auto h-[calc(100vh-120px)] w-full max-w-4xl px-8 py-12 sm:h-[75vh]">
                        <Plate editor={editor}>
                          <PlateContent
                            className="selection:bg-primary/20 min-h-full text-lg outline-none"
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
              variant="bordered"
              className="border-foreground/10 hover:bg-foreground/5 hover:border-foreground/20 h-14 px-8 text-base font-bold backdrop-blur-md transition-all"
              onPress={() => window.open("https://github.com/heroui-inc/heroui", "_blank")}
            >
              <LogoGithub className="mr-2 size-5" />
              {t("viewGithub")}
            </Button>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="mt-40 flex w-full max-w-6xl flex-col items-center px-6">
          <motion.div variants={itemVariants} className="mb-20 text-center">
            <h2 className="from-foreground to-foreground/60 bg-gradient-to-r bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-5xl">
              {t("featuresTitle")}
            </h2>
            <div className="via-primary/50 mx-auto mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent to-transparent" />
          </motion.div>

          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: t("feature1Title"),
                desc: t("feature1Desc"),
                icon: PencilToSquare,
                color: "primary",
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
                  className="group relative h-full overflow-hidden border border-white/5 bg-white/5 p-8 backdrop-blur-lg transition-all duration-500 hover:-translate-y-2 hover:border-white/10 hover:bg-white/10 hover:shadow-2xl"
                  style={{
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div
                    className={cn(
                      "mb-6 flex size-14 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3",
                      feature.color === "primary"
                        ? "bg-primary/20 text-primary"
                        : feature.color === "success"
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning",
                    )}
                  >
                    <feature.icon className="size-7" />
                  </div>
                  <h3 className="text-foreground mb-3 text-2xl font-bold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-foreground/70 text-base leading-relaxed">{feature.desc}</p>

                  {/* Decorative Background Icon */}
                  <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-[0.02] transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.06]">
                    <feature.icon className="size-48" />
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
