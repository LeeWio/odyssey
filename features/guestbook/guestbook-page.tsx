"use client";

import { BookOpen, PencilToSquare } from "@gravity-ui/icons";
import { Button, Chip, Typography } from "@heroui/react";

import { CommentSystem } from "@/components/comment/comment-system";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

export function GuestbookPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-4xl">
        <header className="border-default-200 grid gap-8 border-b pb-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="max-w-2xl">
            <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
              <BookOpen aria-hidden="true" className="size-4" />
              Visitor log
            </div>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              Leave a note before you go.
            </Typography>
            <Typography color="muted" type="body" className="mt-5 max-w-xl leading-7">
              Questions, small observations, and useful links are welcome. Every entry is reviewed
              before it becomes part of this public record.
            </Typography>
          </div>
          <Chip className="w-fit" size="sm" variant="soft">
            Moderated conversation
          </Chip>
        </header>

        {!isAuthenticated ? (
          <div className="border-default-200 bg-surface-secondary mt-8 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <Typography type="body-sm" weight="semibold">
                Sign in to add an entry
              </Typography>
              <Typography color="muted" type="body-xs" className="mt-1">
                Reading is open to everyone. Sign in to leave a note or reply.
              </Typography>
            </div>
            <Button size="sm" onPress={() => dispatch(setLoginOpen(true))}>
              <PencilToSquare aria-hidden="true" className="size-4" />
              Sign in to write
            </Button>
          </div>
        ) : null}

        <section aria-label="Guestbook entries" className="mt-10">
          <CommentSystem isGuestbook />
        </section>
      </div>
    </div>
  );
}
