"use client";

import { useEffect, useState } from "react";

export type ToastTone = "success" | "error";
export type ToastPlacement = "top-right" | "bottom-left";

export type ToastMessage = {
  id: string;
  message: string;
  tone: ToastTone;
  placement: ToastPlacement;
};

type ToastLayerProps = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 20);
    const hideTimer = window.setTimeout(() => setVisible(false), 2600);
    const dismissTimer = window.setTimeout(() => onDismiss(toast.id), 3000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [onDismiss, toast.id]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "pointer-events-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-300",
        toast.tone === "success"
          ? "border-green-300 bg-green-500 text-white dark:border-green-700 dark:bg-green-600"
          : "border-red-300 bg-red-500 text-white dark:border-red-700 dark:bg-red-600",
        visible
          ? "opacity-100 translate-y-0"
          : toast.placement === "top-right"
          ? "opacity-0 -translate-y-2"
          : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}

export function ToastLayer({ toasts, onDismiss }: ToastLayerProps) {
  const topRightToasts = toasts.filter((t) => t.placement === "top-right");
  const bottomLeftToasts = toasts.filter((t) => t.placement === "bottom-left");

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(90vw,22rem)] flex-col gap-2">
        {topRightToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>

      <div className="pointer-events-none fixed bottom-4 left-4 z-50 flex w-[min(90vw,22rem)] flex-col gap-2">
        {bottomLeftToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
}
