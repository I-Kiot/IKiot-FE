"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      className="toaster group"
      position="top-right"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      theme={theme}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--normal-icon": "var(--foreground)",
          "--success-bg": "var(--toast-success-bg)",
          "--success-border": "var(--toast-success-border)",
          "--success-text": "var(--toast-success-text)",
          "--error-bg": "var(--toast-error-bg)",
          "--error-border": "var(--toast-error-border)",
          "--error-text": "var(--toast-error-text)",
          "--warning-bg": "var(--toast-warning-bg)",
          "--warning-border": "var(--toast-warning-border)",
          "--warning-text": "var(--toast-warning-text)",
          "--info-bg": "var(--toast-info-bg)",
          "--info-border": "var(--toast-info-border)",
          "--info-text": "var(--toast-info-text)",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "flex gap-3 items-start p-4 rounded-[0.75rem] border shadow-md font-body text-sm",
          title: "font-headline font-bold text-sm",
          description: "font-body text-xs opacity-90",
          success:
            "bg-[--success-bg] border-[--success-border] text-[--success-text]",
          error: "bg-[--error-bg] border-[--error-border] text-[--error-text]",
          warning:
            "bg-[--warning-bg] border-[--warning-border] text-[--warning-text]",
          info: "bg-[--info-bg] border-[--info-border] text-[--info-text]",
          actionButton:
            "font-headline font-bold text-xs px-3 py-1 rounded hover:opacity-80 transition-opacity",
          cancelButton:
            "font-headline font-bold text-xs px-3 py-1 rounded hover:opacity-80 transition-opacity",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
