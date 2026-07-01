import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export interface ConfirmSpec {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  action: () => void;
}

interface Props {
  spec: ConfirmSpec | null;
  onClose: () => void;
}

export default function ConfirmDialog({ spec, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <AnimatePresence>
      {spec && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] grid place-items-center bg-[var(--color-ink)]/25 p-6 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  spec.danger
                    ? "bg-rose-50 text-rose-500"
                    : "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]"
                }`}
              >
                <AlertTriangle size={19} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[var(--color-ink)]">
                  {spec.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                  {spec.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-2)]"
              >
                Abbrechen
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  spec.action();
                  onClose();
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 ${
                  spec.danger ? "bg-rose-500" : "bg-[var(--color-accent)]"
                }`}
              >
                {spec.confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
