import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, AlertCircle } from "lucide-react";
import { ToastMessage } from "../types";

interface ToastViewportProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div className="fixed right-4 top-4 z-[200] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
              toast.tone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : toast.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {toast.tone === "error" ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : toast.tone === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <Info className="mt-0.5 h-5 w-5 shrink-0" />}
            <div className="flex-1 text-sm">{toast.message}</div>
            <button aria-label="Dismiss notification" className="text-sm font-semibold opacity-70 transition hover:opacity-100" onClick={() => onDismiss(toast.id)}>
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
