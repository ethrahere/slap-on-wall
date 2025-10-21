"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import clsx from "clsx";
import { getDeterministicRotation } from "@/lib/rotation";
import type { PostIt } from "@/lib/types";

export type BoardPost = PostIt & {
  isFresh?: boolean;
  isOwn?: boolean;
};

type PostItCardProps = {
  post: BoardPost;
  onSelect: (id: string) => void;
  onHeart: (id: string) => void;
  isOwn: boolean;
};

export default function PostItCard({
  post,
  onSelect,
  onHeart,
  isOwn,
}: PostItCardProps) {
  const rotation = getDeterministicRotation(post.id);
  const createdAtLabel = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });

  const backgroundStyle =
    post.color.startsWith("linear-gradient") || post.color.startsWith("radial-gradient")
      ? { background: post.color }
      : { backgroundColor: post.color };

  return (
    <motion.article
      whileHover={{ rotate: 0, scale: 1.02 }}
      initial={{ rotate: rotation }}
      className={clsx(
        "group relative cursor-pointer rounded-xl p-6 font-handwriting text-[1.25rem] leading-snug text-shefi-ink shadow-[var(--shefi-card-shadow)] transition-all duration-300 group-hover:animate-[floaty_6s_ease-in-out_infinite]",
        post.isFresh
          ? "ring-4 ring-[rgba(236,72,153,0.6)] shadow-[0_0_32px_rgba(236,72,153,0.3)]"
          : "ring-2 ring-transparent",
      )}
      style={backgroundStyle}
      onClick={() => onSelect(post.id)}
    >
      <div className="absolute inset-0 rounded-xl bg-transparent transition duration-300 group-hover:bg-transparent" />
      <div className="relative flex min-h-[180px] flex-col gap-4">
        <p className="font-handwriting text-xl leading-relaxed text-shefi-ink">
          {post.text}
        </p>
        <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 text-sm font-sans text-shefi-ink-soft">
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {post.isAnonymous
                ? "— anonymous queen"
                : post.signature
                ? `— ${normalizeSignature(post.signature)}`
                : "— anonymous queen"}
            </span>
            <span className="text-xs uppercase tracking-wide text-[rgba(109,74,139,0.8)]">
              {createdAtLabel}
            </span>
          </div>
          <motion.button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onHeart(post.id);
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.6)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-shefi-purple transition hover:bg-white"
          >
            <span aria-hidden className="text-base transition-transform group-hover:scale-110">
              ❤️
            </span>
            <span>{post.hearts}</span>
          </motion.button>
        </footer>
        {isOwn ? (
          <span className="absolute -right-1 -top-2 rounded-full bg-[rgba(139,92,246,0.8)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            Yours
          </span>
        ) : null}
      </div>
    </motion.article>
  );
}

function normalizeSignature(signature: string | null): string {
  if (!signature) return "anonymous queen";
  return signature.startsWith("@") ? signature : `@${signature}`;
}
