"use client";

import { Button, Card, Input, Link, toast } from "@heroui/react";
import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useSubscribeMutation } from "@/lib/features/openapi";
import { ModeSwitch } from "./theme-switch";

const footerLinks = [
  { href: "/chronicle", label: "Chronicle" },
  { href: "/universe", label: "Universe" },
  { href: "/guestbook", label: "Guestbook" },
  { href: "https://github.com/LeeWio", label: "GitHub" },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribe, { isLoading: isSubscribing }] = useSubscribeMutation();
  const shouldReduceMotion = useReducedMotion() ?? false;

  const reveal = (delay = 0) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: shouldReduceMotion ? 0 : 0.6, delay, ease: easeOut },
  });

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      toast.warning("Enter an email address to subscribe.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.warning("Enter a valid email address.");
      return;
    }

    try {
      await subscribe({ email: normalizedEmail }).unwrap();
      setEmail("");
      toast.success("Check your inbox to confirm your subscription.");
    } catch {
      // The generated mutation reports API failures through the shared toast helper.
    }
  };

  return (
    <footer className="w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pt-20 pb-8 sm:px-10 sm:pt-28">
        <motion.div {...reveal()}>
          <Card variant="secondary" className="gap-6 p-6 sm:p-8">
            <Card.Header className="max-w-xl gap-2 p-0">
              <Card.Title className="text-2xl tracking-[-0.03em]">
                Keep the thread going.
              </Card.Title>
              <Card.Description>
                Occasional notes on software, markets, music, and the work behind the work.
              </Card.Description>
            </Card.Header>
            <Card.Content className="p-0">
              <form
                className="flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:items-center"
                onSubmit={handleSubscribe}
              >
                <Input
                  aria-label="Email address"
                  autoComplete="email"
                  className="min-w-0 sm:flex-1"
                  name="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubscribing}
                  variant="secondary"
                />
                <Button type="submit" isPending={isSubscribing}>
                  Subscribe
                </Button>
              </form>
            </Card.Content>
          </Card>
        </motion.div>

        <motion.div
          {...reveal(0.08)}
          className="border-divider flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-sm">
            <p className="text-foreground text-sm font-semibold">Odyssey</p>
            <p className="text-muted mt-2 text-sm leading-6">
              A living notebook for ideas, systems, and the quiet momentum between them.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map((item) => (
              <Link
                key={item.label}
                className="text-sm"
                href={item.href}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                target={item.href.startsWith("http") ? "_blank" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </motion.div>

        <motion.div
          {...reveal(0.16)}
          className="text-muted flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span>© 2026 Odyssey</span>
            <Link href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
              鄂ICP备2026038770号-1
            </Link>
            <Link
              className="flex items-center gap-1"
              href="https://beian.mps.gov.cn/#/query/webSearch?code=44030002016102"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                alt=""
                aria-hidden="true"
                height={16}
                src="https://beian.mps.gov.cn/web/assets/logo01.6189a29f.png"
                width={16}
              />
              粤公网安备44030002016102号
            </Link>
          </div>
          <ModeSwitch size="sm" variant="default" />
        </motion.div>
      </div>
    </footer>
  );
}
