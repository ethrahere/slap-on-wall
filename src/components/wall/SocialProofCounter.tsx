"use client";

import { motion } from "framer-motion";

type SocialProofCounterProps = {
  count: number;
};

export default function SocialProofCounter({ count }: SocialProofCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="inline-flex items-center gap-3 rounded-full bg-[rgba(255,255,255,0.7)] px-4 py-2 text-sm font-semibold text-shefi-ink shadow-sm ring-1 ring-[rgba(255,255,255,0.8)] backdrop-blur"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-[rgba(236,72,153,0.6)] text-lg">
        👑
      </span>
      <div className="text-left">
        <p className="text-xs uppercase tracking-[0.2em] text-shefi-ink-soft">
          Queens on the wall
        </p>
        <p className="text-base font-bold text-shefi-purple">
          {Intl.NumberFormat("en-US").format(count)} queens have left their mark
        </p>
      </div>
    </motion.div>
  );
}
