import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastListener = (toast: Toast) => void;

let nextToastId = 1;
const listeners = new Set<ToastListener>();

export const showToast = (input: Omit<Toast, "id">): void => {
  const toast: Toast = {
    id: nextToastId,
    ...input
  };
  nextToastId += 1;
  listeners.forEach((listener) => listener(toast));
};

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast: ToastListener = (toast) => {
      setItems((current) => [...current, toast]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== toast.id));
      }, 3500);
    };

    listeners.add(handleToast);

    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((toast) => {
        const variant = toast.variant || "info";
        const backgroundClass =
          variant === "success"
            ? "bg-green-50 border-green-200 text-green-900"
            : variant === "error"
            ? "bg-red-50 border-red-200 text-red-900"
            : "bg-gray-50 border-gray-200 text-gray-900";

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto w-full max-w-md rounded-lg border px-4 py-3 shadow-md",
              backgroundClass
            )}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description ? (
              <p className="mt-1 text-xs text-gray-600">{toast.description}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};


