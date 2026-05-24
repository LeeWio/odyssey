"use client";

import {Button} from "@heroui/react";
import {Sheet} from "@heroui-pro/react";

/**
 * DashboardSheet (Skeleton)
 * Completely copied from HeroUI Pro Sheet Demo for initial setup.
 */
export function DashboardSheet() {
  return (
    <Sheet>
      <Sheet.Trigger>
        <Button variant="secondary">Open Dashboard Sheet</Button>
      </Sheet.Trigger>
      <Sheet.Backdrop>
        <Sheet.Content className="mx-auto max-h-[95vh] max-w-[420px]">
          <Sheet.Dialog>
            <Sheet.Handle />
            <Sheet.CloseTrigger />
            <Sheet.Header>
              <Sheet.Heading>Sheet Title</Sheet.Heading>
            </Sheet.Header>
            <Sheet.Body>
              <p className="text-muted text-sm">
                This is a bottom sheet built with smooth drag-to-dismiss animations. Try dragging it
                down to close, or use the close button.
              </p>
            </Sheet.Body>
            <Sheet.Footer>
              <Sheet.Close>
                <Button variant="secondary">Cancel</Button>
              </Sheet.Close>
              <Sheet.Close>
                <Button>Confirm</Button>
              </Sheet.Close>
            </Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
