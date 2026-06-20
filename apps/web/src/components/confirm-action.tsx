"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function ConfirmAction({
  children,
  confirmMessage,
  disabled,
  onConfirm,
  variant = "outline",
}: {
  children: ReactNode;
  confirmMessage: string;
  disabled?: boolean;
  onConfirm: () => void;
  variant?: "default" | "destructive" | "ghost" | "link" | "outline" | "secondary";
}) {
  return (
    <Button
      className="h-12"
      disabled={disabled}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          onConfirm();
        }
      }}
      type="button"
      variant={variant}
    >
      {children}
    </Button>
  );
}
