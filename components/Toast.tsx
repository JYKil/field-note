"use client";

import { useToast } from "@/lib/ToastContext";

export default function Toast() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-[slideUp_0.3s_ease-out] ${
            toast.type === "success"
              ? "bg-success text-zinc-950"
              : toast.type === "error"
                ? "bg-error text-zinc-950"
                : "bg-zinc-800 text-muted"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
