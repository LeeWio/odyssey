"use client";

import {
  Globe,
  Heart,
  CircleInfo as Info,
  PaperPlane as Send,
  Sparkles,
  ArrowRight,
  CircleCheck,
  CirclePlay,
  CircleExclamation,
} from "@gravity-ui/icons";
import {
  Button,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Spinner,
  Surface,
  TextField,
  Typography,
} from "@heroui/react";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { type FormEvent, useState, useMemo, useEffect } from "react";
import Image from "next/image";

import {
  type FriendLinkRequest,
  type FriendLinkResponse,
  useApplyFriendLinkMutation,
  useGetPublicFriendLinksQuery,
} from "@/lib/features/friend-link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FluidBackdrop } from "@/components/background/fluid-backdrop";

const MotionSurface = motion.create(Surface);

// --- Mock RSS Data for "Friend Circle" ---
const MOCK_SPARKS = [
  {
    id: 1,
    friendName: "Alice's Studio",
    title: "The Future of Generative UI",
    date: "2 hours ago",
    url: "#",
  },
  {
    id: 2,
    friendName: "Bob Dev",
    title: "Rust for Frontend Engineers: Why it matters",
    date: "5 hours ago",
    url: "#",
  },
  {
    id: 3,
    friendName: "Charlie Design",
    title: "Minimalism in 2026",
    date: "Yesterday",
    url: "#",
  },
  {
    id: 4,
    friendName: "Diana Labs",
    title: "Deep Dive into React 19 Actions",
    date: "2 days ago",
    url: "#",
  },
];

export default function PremiumFriendLinksPage() {
  const { scrollYProgress } = useScroll();
  const { data: links = [], isLoading } = useGetPublicFriendLinksQuery();
  const [applyLink, { isLoading: isApplying }] = useApplyFriendLinkMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSparksLoading, setIsSparksLoading] = useState(true);

  // Simulate RSS Fetching delay
  useEffect(() => {
    const timer = setTimeout(() => setIsSparksLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Form State
  const [formData, setFormData] = useState<FriendLinkRequest>({
    name: "",
    url: "",
    avatar: "",
    description: "",
    email: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await applyLink(formData).unwrap();
      setIsModalOpen(false);
      setFormData({ name: "", url: "", avatar: "", description: "", email: "" });
    } catch {
      // Toast handled in API
    }
  };

  return (
    <div className="selection:bg-accent/30 relative min-h-screen">
      <FluidBackdrop scrollYProgress={scrollYProgress} />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-24 md:pt-48">
        {/* --- Hero Section --- */}
        <section className="mb-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <Chip
              variant="soft"
              color="accent"
              className="mb-8 px-5 py-1.5 text-xs font-bold tracking-widest uppercase"
            >
              <Heart className="mr-1 size-3.5 fill-current" />
              <Chip.Label>Digital Resonance</Chip.Label>
            </Chip>
            <Typography className="mb-8 text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl">
              Circle of <span className="text-accent italic">Friends</span>
            </Typography>
            <Typography className="text-muted/80 mx-auto max-w-2xl text-lg leading-relaxed md:text-xl">
              A curated constellation of creative minds and digital outposts. We believe in an open,
              interconnected web built on shared passions and high design.
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-12 flex flex-wrap justify-center gap-4"
          >
            <Button
              size="lg"
              variant="primary"
              className="bg-accent text-accent-foreground shadow-accent/20 h-14 rounded-full px-8 font-bold shadow-2xl transition-all hover:scale-105 active:scale-95"
              onPress={() => setIsModalOpen(true)}
            >
              <Send className="mr-2 size-5" />
              Apply for Exchange
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="border-border/50 bg-background/50 hover:bg-background/80 h-14 rounded-full px-8 font-bold backdrop-blur-md transition-all"
              onPress={() =>
                document.getElementById("friend-circle")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Recent Sparks
            </Button>
          </motion.div>
        </section>

        {/* --- Friend Circle (Recent Sparks) --- */}
        <section id="friend-circle" className="mb-40">
          <div className="mb-10 flex items-end justify-between px-2">
            <div className="flex flex-col gap-2">
              <div className="text-accent flex items-center gap-2">
                <Sparkles className="size-5" />
                <Typography className="text-sm font-bold tracking-widest uppercase">
                  Recent Sparks
                </Typography>
              </div>
              <Typography className="text-3xl font-bold tracking-tight">
                Signals from the Network
              </Typography>
            </div>
            <Typography className="text-muted hidden text-sm md:block">
              Latest updates fetched from RSS feeds
            </Typography>
          </div>

          <div className="relative -mx-6 overflow-hidden px-6">
            <div className="flex scrollbar-none gap-6 overflow-x-auto pb-8">
              {isSparksLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-[300px] shrink-0">
                      <Surface
                        variant="secondary"
                        className="bg-default-100 flex h-[140px] animate-pulse flex-col justify-between rounded-[2rem] p-6"
                      >
                        <div />
                      </Surface>
                    </div>
                  ))
                : MOCK_SPARKS.map((spark, idx) => (
                    <motion.div
                      key={spark.id}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.6 }}
                      className="w-[300px] shrink-0"
                    >
                      <Surface
                        variant="secondary"
                        className="ring-border/50 hover:ring-accent/30 flex h-full flex-col justify-between rounded-[2rem] p-6 ring-1 transition-all hover:shadow-xl"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              className="bg-accent size-1.5 rounded-full shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)]"
                            />
                            <Typography className="text-accent text-xs font-bold">
                              {spark.friendName}
                            </Typography>
                          </div>
                          <Typography className="line-clamp-2 text-base leading-tight font-bold tracking-tight">
                            {spark.title}
                          </Typography>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <Typography className="text-muted/60 text-xs">{spark.date}</Typography>
                          <Button isIconOnly size="sm" variant="ghost" className="rounded-full">
                            <ArrowRight className="size-4" />
                          </Button>
                        </div>
                      </Surface>
                    </motion.div>
                  ))}
            </div>
          </div>
        </section>

        {/* --- Main Grid --- */}
        <section className="mb-40">
          <div className="mb-12 flex flex-col items-center gap-3 px-4 text-center">
            <Typography className="text-4xl font-black tracking-tighter sm:text-5xl">
              Directory of{" "}
              <span className="text-accent decoration-accent/20 underline underline-offset-8">
                Connections
              </span>
            </Typography>
            <Typography className="text-muted/70 max-w-xl">
              A collection of exceptional digital gardens and technical outposts.
            </Typography>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" color="accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {links.map((link, index) => (
                  <FriendCard key={link.id} link={link} index={index} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* --- Exchange Policy --- */}
        <section className="mt-60">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Surface
              variant="secondary"
              className="ring-border/50 relative overflow-hidden rounded-[3.5rem] p-8 shadow-2xl ring-1 md:p-20"
            >
              <div className="bg-accent/20 absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full p-20 blur-[120px]" />

              <div className="relative z-10 grid grid-cols-1 gap-20 lg:grid-cols-2">
                <div className="flex flex-col gap-10">
                  <div className="flex flex-col gap-4">
                    <div className="bg-accent/10 text-accent flex size-14 items-center justify-center rounded-[1.5rem]">
                      <Info className="size-7" />
                    </div>
                    <Typography className="text-4xl font-bold tracking-tight">
                      Exchange <span className="text-accent">Policy</span>
                    </Typography>
                  </div>

                  <Typography className="text-muted/80 text-lg leading-relaxed">
                    We value sites that share our pursuit of elegant engineering, deep thoughts, and
                    high design aesthetics.
                  </Typography>

                  <ul className="space-y-6">
                    {[
                      "Content must be original and updated regularly",
                      "No low-quality or unauthorized content",
                      "HTTPS protocol is strictly required",
                      "Our link should be active on your site before applying",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="bg-accent/10 text-accent mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                          <CircleCheck className="size-3" />
                        </div>
                        <Typography className="text-muted/80 text-base">{item}</Typography>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-background/40 ring-border/50 rounded-[2.5rem] p-10 shadow-inner ring-1 backdrop-blur-xl">
                  <div className="mb-10 flex flex-col gap-1">
                    <Typography className="text-2xl font-bold tracking-tight">
                      Our Identity
                    </Typography>
                    <Typography className="text-muted text-sm">
                      Use these details for the exchange
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    {[
                      { label: "Site Name", value: "Odyssey", mono: false },
                      { label: "Site URL", value: "https://odyssey.com", mono: true },
                      { label: "Logo URL", value: "https://odyssey.com/avatar.png", mono: true },
                      {
                        label: "Site Intro",
                        value: "Deep coordinates of elegant engineering.",
                        mono: false,
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <Typography className="text-muted/50 text-[10px] font-bold tracking-widest uppercase">
                          {item.label}
                        </Typography>
                        <div className="group relative">
                          <Typography
                            className={`text-sm ${item.mono ? "font-mono" : "font-medium"} group-hover:text-accent transition-colors`}
                          >
                            {item.value}
                          </Typography>
                          <div className="bg-accent mt-2 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Surface>
          </motion.div>
        </section>
      </main>

      <Footer />

      {/* --- Apply Modal --- */}
      <Modal>
        <Modal.Backdrop
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          variant="blur"
          className="z-[100]"
        >
          <Modal.Container size="sm">
            <Modal.Dialog className="overflow-hidden rounded-[3rem] border-none shadow-[0_0_80px_rgba(var(--accent-rgb),0.15)]">
              <Modal.CloseTrigger />
              <Form onSubmit={handleSubmit} className="p-4 md:p-6">
                <Modal.Header className="flex flex-col gap-2 pb-8">
                  <div className="bg-accent text-accent-foreground shadow-accent/20 flex size-12 items-center justify-center rounded-2xl shadow-lg">
                    <Send className="size-6" />
                  </div>
                  <Modal.Heading className="text-3xl font-black tracking-tighter">
                    Request Exchange
                  </Modal.Heading>
                  <Typography className="text-muted/80 text-sm">
                    Join our constellation of digital artisans.
                  </Typography>
                </Modal.Header>

                <Modal.Body className="flex flex-col gap-6 py-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <TextField isRequired name="name">
                      <Label className="text-muted/60 text-xs font-bold tracking-widest uppercase">
                        Site Name
                      </Label>
                      <Input
                        variant="secondary"
                        placeholder="My Creative Space"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="rounded-2xl"
                      />
                      <FieldError />
                    </TextField>

                    <TextField isRequired name="url">
                      <Label className="text-muted/60 text-xs font-bold tracking-widest uppercase">
                        Site URL
                      </Label>
                      <Input
                        variant="secondary"
                        placeholder="https://mysite.com"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="rounded-2xl"
                      />
                      <FieldError />
                    </TextField>
                  </div>

                  <TextField name="avatar">
                    <Label className="text-muted/60 text-xs font-bold tracking-widest uppercase">
                      Avatar / Logo URL
                    </Label>
                    <Input
                      variant="secondary"
                      placeholder="https://mysite.com/logo.png"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="rounded-2xl"
                    />
                  </TextField>

                  <TextField name="description">
                    <Label className="text-muted/60 text-xs font-bold tracking-widest uppercase">
                      Site Intro
                    </Label>
                    <Input
                      variant="secondary"
                      placeholder="A short story about your digital garden."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="rounded-2xl"
                    />
                  </TextField>

                  <TextField name="email">
                    <Label className="text-muted/60 text-xs font-bold tracking-widest uppercase">
                      Contact Email
                    </Label>
                    <Input
                      variant="secondary"
                      type="email"
                      placeholder="hello@mysite.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-2xl"
                    />
                  </TextField>
                </Modal.Body>

                <Modal.Footer className="pt-10">
                  <Button slot="close" variant="ghost" className="rounded-full px-8">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="bg-accent text-accent-foreground shadow-accent/20 rounded-full px-10 font-bold shadow-xl"
                    isPending={isApplying}
                  >
                    {({ isPending }) => (
                      <>
                        {isPending && <Spinner size="sm" color="current" />}
                        Submit Application
                      </>
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

function FriendCard({ link, index }: { link: FriendLinkResponse; index: number }) {
  // Randomly assign a status for visual flair (in real world, this would come from backend detection)
  const statusInfo = useMemo(() => {
    const statuses = [
      { color: "text-success", icon: CircleCheck, label: "Active" },
      { color: "text-warning", icon: CirclePlay, label: "Slow" },
      { color: "text-muted", icon: CircleExclamation, label: "Unstable" },
    ];
    return statuses[index % 3];
  }, [index]);

  return (
    <MotionSurface
      variant="secondary"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        delay: index * 0.05,
        ease: [0.23, 1, 0.32, 1],
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group ring-border/50 bg-background/40 hover:bg-background/60 hover:ring-accent/30 relative flex flex-col gap-6 rounded-[2.5rem] p-8 ring-1 backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(var(--accent-rgb),0.05)]"
    >
      <div className="flex items-start justify-between">
        <div className="relative size-20 shrink-0">
          <div className="bg-accent/20 absolute inset-0 rounded-[1.75rem] opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
          <div className="ring-background/50 relative size-full overflow-hidden rounded-[1.75rem] shadow-2xl ring-4">
            {link.avatar ? (
              <Image
                fill
                src={link.avatar}
                alt={link.name}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="bg-accent/10 text-accent flex h-full w-full items-center justify-center text-3xl font-black">
                {link.name.slice(0, 1)}
              </div>
            )}
          </div>
          {/* Status Indicator */}
          <div
            className={`bg-background ring-border/50 absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full p-1 shadow-lg ring-1`}
          >
            <statusInfo.icon className={`size-3.5 ${statusInfo.color}`} />
          </div>
        </div>

        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-background/50 text-muted hover:bg-accent hover:text-accent-foreground ring-border/20 flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 transition-all hover:scale-110 hover:rotate-12"
          title={`Visit ${link.name}`}
        >
          <Globe className="size-6" />
        </a>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <Typography className="group-hover:text-accent text-2xl font-black tracking-tighter transition-colors">
            {link.name}
          </Typography>
          <div className="flex items-center gap-1.5">
            <statusInfo.icon className={`size-3 ${statusInfo.color} opacity-70`} />
            <Typography className="text-muted/50 text-[10px] font-bold tracking-widest uppercase">
              Connection {statusInfo.label}
            </Typography>
          </div>
        </div>
        <Typography className="text-muted/70 line-clamp-2 min-h-[40px] text-sm leading-relaxed">
          {link.description || "A beautiful corner of the digital world dedicated to excellence."}
        </Typography>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="from-accent/20 h-[1px] flex-1 bg-gradient-to-r to-transparent" />
        <Typography className="text-muted/40 pl-4 font-mono text-[10px] tracking-widest uppercase">
          {new URL(link.url).hostname}
        </Typography>
      </div>
    </MotionSurface>
  );
}
