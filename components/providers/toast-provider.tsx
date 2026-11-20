"use client";

import { Toast } from "@heroui/react";

export function ToastProvider() {
  return <Toast.Provider maxVisibleToasts={4} placement="bottom end" />;
}
