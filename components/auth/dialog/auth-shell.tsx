import { Modal } from "@heroui/react";
import type { ReactNode } from "react";

interface AuthDialogShellProps {
  children: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export const AuthDialogShell = ({ children, isOpen, onOpenChange }: AuthDialogShellProps) => (
  <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
    <Modal.Container scroll="inside" size="sm">
      <Modal.Dialog>
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
      <Modal.Heading>{title}</Modal.Heading>
      {subtitle ? (
        <p className="text-muted text-sm leading-5 text-pretty wrap-break-word">{subtitle}</p>
      ) : null}
    </Modal.Header>
    <Modal.Body>{children}</Modal.Body>
  </>
);
