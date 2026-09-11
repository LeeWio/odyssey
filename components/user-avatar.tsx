"use client";

import { Avatar } from "@heroui/react";
import { useEffect, useState } from "react";
import { emailAvatarUrl, resolveStoredAvatar } from "@/lib/features/user/user-avatar";

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "soft";
  className?: string;
}

export function UserAvatar({
  name,
  avatar,
  email,
  size = "sm",
  variant,
  className,
}: UserAvatarProps) {
  const stored = resolveStoredAvatar(avatar);
  const [emailSrc, setEmailSrc] = useState<string | null>(null);
  const src = stored ?? emailSrc;
  const fallback = name.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    if (stored || !email) {
      return;
    }

    let cancelled = false;
    void emailAvatarUrl(email).then((url) => {
      if (!cancelled) {
        setEmailSrc(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [stored, email]);

  return (
    <Avatar size={size} variant={variant} className={className}>
      {src ? <Avatar.Image alt={name} referrerPolicy="no-referrer" src={src} /> : null}
      <Avatar.Fallback>{fallback}</Avatar.Fallback>
    </Avatar>
  );
}
