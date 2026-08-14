"use client";

import { useOs } from "@mantine/hooks";
import { Button, Chip, Input, Label, Link, TextField, Typography, toast } from "@heroui/react";
import { useState, type FormEvent } from "react";

import { SmartColorSurface } from "@/components/background/smart-color-surface";
import { useSubscribeMutation } from "@/lib/features/openapi";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/uses", label: "Setup" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/schedule", label: "Schedule" },
  { href: "/explorer", label: "Explorer" },
  { href: "/blog", label: "Chronicle" },
  { href: "/explore", label: "Explore" },
  { href: "/columns", label: "Columns" },
  { href: "/links", label: "Travelogue" },
  { href: "/guestbook", label: "Guestbook" },
] as const;

export function Footer() {
  const os = useOs();
  const osLabel = os === "macos" ? "macOS" : os;
  const [email, setEmail] = useState("");
  const [subscribe, { isLoading: isSubscribing }] = useSubscribeMutation();

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
    <footer className="w-full px-4 pt-10 pb-4 sm:px-6 sm:pt-12 sm:pb-6">
      <SmartColorSurface
        className="mx-auto min-h-64 max-w-[1440px] rounded-[2rem] sm:min-h-72 sm:rounded-[2.5rem]"
        seed="odyssey-global-footer"
        tone="neutral"
      >
        <div className="flex min-h-64 flex-col justify-between gap-12 p-6 sm:min-h-72 sm:p-9 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)_auto] lg:items-start">
            <div className="max-w-xl">
              <Typography
                className="font-mono tracking-[0.16em] text-white/60 uppercase"
                type="body-xs"
              >
                Odyssey / Field notes
              </Typography>
              <Typography className="mt-3 text-white" type="h2">
                Software, markets, music, and movement.
              </Typography>
              <Typography className="mt-4 max-w-lg text-white/68" type="body-sm">
                A personal record of what I build, study, hear, and notice along the way.
              </Typography>
            </div>

            <form noValidate className="max-w-md" onSubmit={handleSubscribe}>
              <TextField
                fullWidth
                isDisabled={isSubscribing}
                name="newsletter-email"
                type="email"
                value={email}
                onChange={setEmail}
              >
                <Label className="text-sm font-medium text-white">Notes, occasionally</Label>
                <div className="mt-3 flex gap-2">
                  <Input
                    className="min-w-0 bg-white/10 text-white shadow-none placeholder:text-white/45"
                    placeholder="you@example.com"
                    variant="secondary"
                  />
                  <Button isPending={isSubscribing} size="sm" type="submit" variant="secondary">
                    Join
                  </Button>
                </div>
              </TextField>
            </form>

            <nav
              aria-label="Footer navigation"
              className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:gap-7"
            >
              {FOOTER_LINKS.map((item) => (
                <Link key={item.label} className="text-sm text-white/78" href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/14 pt-5 sm:flex-row sm:items-center sm:justify-between">
            {os !== "undetermined" ? (
              <Chip
                className="w-fit bg-white/12 text-white"
                color="default"
                size="sm"
                variant="soft"
              >
                Running on {osLabel}
              </Chip>
            ) : (
              <Typography className="text-white/58" type="body-xs">
                Built for the open web
              </Typography>
            )}

            <Link
              className="w-fit text-xs text-white/58"
              href="https://beian.miit.gov.cn/"
              rel="noopener noreferrer"
              target="_blank"
            >
              鄂ICP备2026038770号-1
            </Link>
          </div>
        </div>
      </SmartColorSurface>
    </footer>
  );
}
