"use client";

import { Button, Input, Link, toast } from "@heroui/react";
import { useCallback, useState, type FormEvent } from "react";
import { useSubscribeMutation } from "@/lib/features/openapi";
import { motion, useReducedMotion } from "motion/react";
import { ModeSwitch } from "./theme-switch";
import { Icon, IconProps } from "@iconify/react";

type SocialIconProps = Omit<IconProps, "icon">;

const footerNavigation = {
  services: [
    { name: "Branding", href: "#" },
    { name: "Data Analysis", href: "#" },
    { name: "E-commerce Solutions", href: "#" },
    { name: "Market Research", href: "#" },
  ],
  supportOptions: [
    { name: "Pricing Plans", href: "#" },
    { name: "User Guides", href: "#" },
    { name: "Tutorials", href: "#" },
    { name: "Service Status", href: "#" },
  ],
  aboutUs: [
    { name: "Our Story", href: "#" },
    { name: "Latest News", href: "#" },
    { name: "Career Opportunities", href: "#" },
    { name: "Media Enquiries", href: "#" },
    { name: "Collaborations", href: "#" },
  ],
  legal: [
    { name: "Claim", href: "#" },
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "User Agreement", href: "#" },
  ],
  social: [
    {
      name: "Facebook",
      href: "#",
      icon: (props: SocialIconProps) => <Icon {...props} icon="fontisto:facebook" />,
    },
    {
      name: "Instagram",
      href: "#",
      icon: (props: SocialIconProps) => <Icon {...props} icon="fontisto:instagram" />,
    },
    {
      name: "Twitter",
      href: "#",
      icon: (props: SocialIconProps) => <Icon {...props} icon="fontisto:twitter" />,
    },
    {
      name: "GitHub",
      href: "https://github.com/LeeWio",
      icon: (props: SocialIconProps) => <Icon {...props} icon="fontisto:github" />,
    },
  ],
};

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribe, { isLoading: isSubscribing }] = useSubscribeMutation();
  const shouldReduceMotion = useReducedMotion() ?? false;

  const reveal = (delay = 0, distance = 16) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance },
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

  const renderList = useCallback(
    ({ title, items }: { title: string; items: { name: string; href: string }[] }) => (
      <div>
        <h3 className="text-small font-semibold">{title}</h3>
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.name}>
              <Link className="" href={item.href}>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ),
    []
  );

  return (
    <footer className="flex w-full flex-col">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <motion.div {...reveal(0)} className="space-y-8 md:pr-8">
            <div className="flex items-center justify-start">
              <span className="text-medium font-medium">ACME</span>
            </div>
            <p className="text-small">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique
            </p>
            <div className="flex space-x-6">
              {footerNavigation.social.map((item) => (
                <Link key={item.name} className="" href={item.href}>
                  <span className="sr-only">{item.name}</span>
                  <item.icon aria-hidden="true" className="w-6" />
                </Link>
              ))}
            </div>
          </motion.div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <motion.div {...reveal(0.1)} className="md:grid md:grid-cols-2 md:gap-8">
              <div>{renderList({ title: "Services", items: footerNavigation.services })}</div>
              <div className="mt-10 md:mt-0">
                {renderList({ title: "Support", items: footerNavigation.supportOptions })}
              </div>
            </motion.div>
            <motion.div {...reveal(0.2)} className="md:grid md:grid-cols-2 md:gap-8">
              <div>{renderList({ title: "About Us", items: footerNavigation.aboutUs })}</div>
              <div className="mt-10 md:mt-0">
                {renderList({ title: "Legal", items: footerNavigation.legal })}
              </div>
            </motion.div>
          </div>
        </div>
        <motion.div
          {...reveal(0.3)}
          className="rounded-medium bg-surface my-10 p-4 sm:my-14 sm:p-8 lg:my-16 lg:flex lg:items-center lg:justify-between lg:gap-2"
        >
          <div>
            <h3 className="text-small font-semibold">Subscribe to our newsletter</h3>
            <p className="text-small mt-2">
              Receive weekly updates with the newest insights, trends, and tools, straight to your
              email.
            </p>
          </div>
          <form className="mt-6 sm:flex sm:max-w-md lg:mt-0" onSubmit={handleSubscribe}>
            <Input
              aria-label="Email"
              autoComplete="email"
              id="email-address"
              name="email-address"
              placeholder="johndoe@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubscribing}
            />
            <div className="mt-4 sm:mt-0 sm:ml-4 sm:shrink-0">
              <Button type="submit" isPending={isSubscribing}>
                Subscribe
              </Button>
            </div>
          </form>
        </motion.div>
        <motion.div
          {...reveal(0.4)}
          className="border-divider flex w-full flex-wrap justify-between gap-2 border-t pt-8"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-small text-muted">&copy; 2024 Acme Inc. All rights reserved.</p>
            <Link
              className="w-fit text-xs transition-colors"
              href="https://beian.miit.gov.cn/"
              rel="noopener noreferrer"
              target="_blank"
            >
              鄂ICP备2026038770号-1
            </Link>
          </div>
          <ModeSwitch size="sm" variant="default" />
        </motion.div>
      </div>
    </footer>
  );
}
