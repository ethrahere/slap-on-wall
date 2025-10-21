"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type RecentActivityToastProps = {
  message: string | null;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 4500;

export default function RecentActivityToast({
  message,
  onDismiss,
}: RecentActivityToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-2xl bg-shefi-purple text-white shadow-xl shadow-[0_20px_40px_rgba(139,92,246,0.4)]"
        >
          <div className="flex items-center gap-3 px-5 py-4">
            <span role="img" aria-hidden className="text-xl">
              🔔
            </span>
            <p className="text-sm font-medium">{message}</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
