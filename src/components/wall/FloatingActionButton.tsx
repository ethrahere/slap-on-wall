"use client";

import { motion } from "framer-motion";

type FloatingActionButtonProps = {
  onClick: () => void;
};

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Leave your mark — join the chaos"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-shefi-purple px-6 py-3 text-base font-semibold text-white shadow-xl shadow-[0_20px_40px_rgba(139,92,246,0.4)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(236,72,153,0.6)] sm:bottom-10 sm:right-10"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
    >
      <span role="img" aria-hidden>
        👋
      </span>
      Slap your truth here
    </motion.button>
  );
}
