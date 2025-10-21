"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { PLACEHOLDER_ROTATIONS, colorFromHue, getDefaultColor } from "@/lib/colors";
import { validatePostText } from "@/lib/wordFilter";
import type { PostIt } from "@/lib/types";
import type { ColorOption } from "@/lib/colors";

type CreatePostItModalProps = {
  onClose: () => void;
  onSubmit: (payload: {
    text: string;
    color: string;
    signature?: string | null;
    isAnonymous: boolean;
  }) => Promise<PostIt>;
  isSubmitting: boolean;
  errorMessage: string | null;
  availableColors: ColorOption[];
  supabaseReady: boolean;
};

const CHARACTER_LIMIT = 150;

export default function CreatePostItModal({
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
  availableColors,
  supabaseReady,
}: CreatePostItModalProps) {
  const [text, setText] = useState("");
  const [color, setColor] = useState(() => getDefaultColor());
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [signature, setSignature] = useState("");
  const [hue, setHue] = useState(45);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const placeholder = useRotatingPlaceholder();

  const previewSignature = isAnonymous
    ? "anonymous queen"
    : signature
    ? signature.replace(/^@/, "")
    : "anonymous queen";

  useEffect(() => {
    setLocalError(null);
  }, [text, color, isAnonymous, signature]);

  useEffect(() => {
    setHelperMessage(
      supabaseReady
        ? "Hot tip: queens are capped at 5 post-its per hour. Make it count."
        : "Supabase credentials missing. You can still craft, but posting needs configuration.",
    );
  }, [supabaseReady]);

  const onFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const validation = validatePostText(text);
    if (!validation.ok) {
      setLocalError(validation.reason ?? "Please add more details.");
      return;
    }

    if (!supabaseReady) {
      setLocalError("Connect Supabase first so the wall can catch your truth.");
      return;
    }

    try {
      await onSubmit({
        text: text.trim(),
        color,
        signature: !isAnonymous && signature ? signature.replace(/^@/, "") : null,
        isAnonymous,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const paletteWithHue = useMemo(() => {
    const sliderColor = colorFromHue(hue);
    return [
      ...availableColors,
      {
        id: "slider",
        label: "Custom Blend",
        value: sliderColor,
      },
    ];
  }, [availableColors, hue]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.4)] backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
      >
        <div className="flex items-center justify-between border-b border-[rgba(139,92,246,0.1)] px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl text-shefi-purple">
              Drop your wisdom (or chaos)
            </h2>
            <p className="text-sm text-shefi-ink-soft">What&apos;s the tea, queen? ☕</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[rgba(139,92,246,0.1)] px-4 py-2 text-sm font-semibold text-shefi-purple transition hover:bg-[rgba(139,92,246,0.2)]"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={onFormSubmit}
          className="flex h-full flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 sm:flex-row"
        >
          <section className="flex w-full flex-1 flex-col gap-6">
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-shefi-ink-soft">
                Step 2 · Spill the tea
              </span>
              <textarea
                value={text}
                onChange={(event) => {
                  if (event.target.value.length <= CHARACTER_LIMIT) {
                    setText(event.target.value);
                  }
                }}
                placeholder={placeholder}
                className="min-h-[180px] w-full resize-none rounded-2xl border border-[rgba(139,92,246,0.2)] bg-[rgba(255,255,255,0.7)] p-4 font-handwriting text-xl leading-relaxed text-shefi-ink shadow-inner outline-none transition focus:border-shefi-purple focus:ring-2 focus:ring-[rgba(236,72,153,0.4)]"
              />
              <span className="self-end text-xs font-medium text-shefi-ink-soft">
                {text.length}/{CHARACTER_LIMIT} characters
              </span>
            </label>

            <label className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-shefi-ink-soft">
                Step 3 · Choose a vibe
              </span>

              <div className="flex flex-wrap gap-3">
                {paletteWithHue.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={clsx(
                      "group relative h-12 min-w-[5.5rem] flex-1 rounded-2xl border border-transparent text-xs font-semibold text-shefi-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shefi-blue sm:flex-initial sm:px-3",
                      color === option.value ? "ring-2 ring-shefi-purple" : "ring-0",
                    )}
                    style={
                      option.value.startsWith("linear-gradient")
                        ? { background: option.value }
                        : { backgroundColor: option.value }
                    }
                    onClick={() => setColor(option.value)}
                  >
                    <span className="absolute inset-x-2 bottom-2 rounded-full bg-[rgba(255,255,255,0.8)] px-2 py-[2px] text-[10px] uppercase tracking-[0.3em] text-[rgba(61,33,87,0.7)] opacity-0 transition group-hover:opacity-100">
                      {option.label}
                    </span>
                    {option.isSpecial ? (
                      <span className="absolute -top-2 right-2 rounded-full bg-shefi-pink px-2 py-[2px] text-[9px] font-bold uppercase tracking-[0.3em] text-white shadow-sm">
                        Special
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={hue}
                onChange={(event) => {
                  const nextHue = Number(event.target.value);
                  setHue(nextHue);
                  setColor(colorFromHue(nextHue));
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 accent-shefi-purple"
              />
            </label>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-shefi-ink-soft">
                Step 4 · Sign it?
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(false)}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    !isAnonymous
                      ? "bg-shefi-purple text-white shadow"
                      : "bg-[rgba(255,255,255,0.8)] text-shefi-ink",
                  )}
                >
                  Sign with my X
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAnonymous(true);
                    setSignature("");
                  }}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    isAnonymous
                      ? "bg-shefi-purple text-white shadow"
                      : "bg-[rgba(255,255,255,0.8)] text-shefi-ink",
                  )}
                >
                  Stay mysterious 👻
                </button>
              </div>
              {!isAnonymous ? (
                <input
                  type="text"
                  value={signature}
                  onChange={(event) => setSignature(event.target.value.slice(0, 30))}
                  placeholder="yourhandle"
                  className="rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(255,255,255,0.8)] px-4 py-2 text-sm text-shefi-ink outline-none focus:border-shefi-purple focus:ring-2 focus:ring-[rgba(236,72,153,0.4)]"
                />
              ) : null}
            </div>
          </section>

          <aside className="flex w-full max-w-[280px] flex-col gap-4">
            <div className="rounded-3xl bg-[rgba(139,92,246,0.1)] p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-shefi-purple">
                Step 3½ · Preview
              </span>
              <div className="mt-4 rounded-2xl p-5 shadow-lg" style={getCardStyle(color)}>
                <p className="font-handwriting text-lg text-shefi-ink">{text || placeholder}</p>
                <div className="mt-6 text-right text-xs text-shefi-ink-soft">
                  — {previewSignature}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[rgba(255,255,255,0.7)] p-4 text-sm text-shefi-ink-soft shadow-inner">
              <p>
                <strong>Anti-spam vibes:</strong> max 5 post-its per hour, minimum 10 characters, and
                no copy/paste twins within 24 hours.
              </p>
            </div>

            {helperMessage ? (
              <p className="text-xs text-shefi-ink-soft">{helperMessage}</p>
            ) : null}

            <AnimatePresence>
              {localError || errorMessage ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {localError ?? errorMessage}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-shefi-pink px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[0_25px_35px_rgba(236,72,153,0.3)] transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="text-lg">🌀</span>
                  Yeeting to the wall...
                </>
              ) : (
                <>
                  <span className="text-lg">🎯</span>
                  Slap it on the wall!
                </>
              )}
            </motion.button>
          </aside>
        </form>
      </motion.div>
    </motion.div>
  );
}

function useRotatingPlaceholder() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * PLACEHOLDER_ROTATIONS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % PLACEHOLDER_ROTATIONS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return PLACEHOLDER_ROTATIONS[index];
}

function getCardStyle(color: string) {
  if (color.startsWith("linear-gradient") || color.startsWith("radial-gradient")) {
    return { background: color };
  }
  return { backgroundColor: color };
}
