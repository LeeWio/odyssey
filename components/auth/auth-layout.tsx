import { Link, Modal, Separator, cn } from "@heroui/react";
import {
  AnimatePresence,
  domMax,
  LazyMotion,
  m,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";

interface AuthDialogShellProps {
  children: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export const AuthDialogShell = ({ children, isOpen, onOpenChange }: AuthDialogShellProps) => (
  <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
    <Modal.Container scroll="inside">
      <Modal.Dialog className="w-full sm:max-w-90">
        <Modal.CloseTrigger />
        {children}
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
);

export const AuthView = ({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) => (
  <>
    <Modal.Header>
      <Modal.Heading className="text-xl font-medium">{title}</Modal.Heading>
      {subtitle ? <p className="text-muted text-sm break-words">{subtitle}</p> : null}
    </Modal.Header>
    <Modal.Body data-scrollbar="none">{children}</Modal.Body>
  </>
);

interface AuthStepProps {
  children: ReactNode;
  className?: string;
  stepKey: string;
}

const reducedMotionVariants = {
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
  hidden: { opacity: 0, y: 0, transition: { duration: 0 } },
};

const motionVariants = {
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.14, ease: "easeOut" as const },
      y: { duration: 0.18, ease: "easeOut" as const },
    },
  },
  hidden: {
    opacity: 0,
    y: 6,
    transition: {
      opacity: { duration: 0.08, ease: "easeIn" as const },
      y: { duration: 0.1, ease: "easeIn" as const },
    },
  },
};

export const AuthStep = ({ children, className, stepKey }: AuthStepProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domMax}>
      <m.div
        className="flex min-h-0 flex-col"
        layout={!shouldReduceMotion}
        transition={{
          layout: shouldReduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 360, damping: 38, mass: 0.8 },
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          <AuthStepContent
            key={stepKey}
            className={className}
            reduceMotion={Boolean(shouldReduceMotion)}
          >
            {children}
          </AuthStepContent>
        </AnimatePresence>
      </m.div>
    </LazyMotion>
  );
};

function AuthStepContent({
  children,
  className,
  reduceMotion,
}: {
  children: ReactNode;
  className?: string;
  reduceMotion: boolean;
}) {
  const isPresent = useIsPresent();
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (isPresent || !content) return;
    const { activeElement, body } = content.ownerDocument;
    if (content.contains(activeElement) || activeElement === body) {
      // Keep keyboard events inside the dialog while the outgoing view is inert.
      content.closest<HTMLElement>('[role="dialog"]')?.focus({ preventScroll: true });
    }
  }, [isPresent]);

  return (
    <m.div
      ref={contentRef}
      inert={!isPresent}
      className={cn("flex min-h-0 w-full flex-col gap-y-3", className)}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={reduceMotion ? reducedMotionVariants : motionVariants}
    >
      {children}
    </m.div>
  );
}

export const AuthDivider = () => (
  <div className="flex items-center gap-4 py-2" aria-hidden="true">
    <Separator className="flex-1" />
    <p className="text-tiny text-default-500 shrink-0">OR</p>
    <Separator className="flex-1" />
  </div>
);

interface AuthSwitchPromptProps {
  actionLabel: ReactNode;
  onAction?: () => void;
  text: ReactNode;
}

export const AuthSwitchPrompt = ({ actionLabel, onAction, text }: AuthSwitchPromptProps) => (
  <div className="text-small mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
    <span>{text}</span>
    <Link
      className="text-small text-accent font-normal underline underline-offset-2"
      onPress={onAction}
    >
      {actionLabel}
    </Link>
  </div>
);
