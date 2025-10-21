"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import clsx from "clsx";
import type { BoardPost } from "@/components/wall/PostItCard";

type PostItDetailModalProps = {
  post: BoardPost;
  onClose: () => void;
  onHeart: (postId: string) => void;
  onShare: (postId: string) => Promise<void>;
  onReport: (postId: string) => Promise<void>;
  isOwn: boolean;
};

export default function PostItDetailModal({
  post,
  onClose,
  onHeart,
  onShare,
  onReport,
  isOwn,
}: PostItDetailModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [isProcessingShare, setIsProcessingShare] = useState(false);

  const formattedDate = useMemo(
    () => format(new Date(post.createdAt), "MMM d · h:mm aaaa"),
    [post.createdAt],
  );

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setIsProcessingShare(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `shefi-wall-${post.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      await onShare(post.id);
      setShareStatus("Downloaded! Go sprinkle it around ✨");
    } catch (error) {
      console.error("Download failed", error);
      setShareStatus("Couldn’t render the post-it. Try again?");
    } finally {
      setIsProcessingShare(false);
    }
  }, [post.id, onShare]);

  const handleCopyToClipboard = useCallback(async () => {
    const clipboardItemCtor = (
      window as typeof window & { ClipboardItem?: typeof ClipboardItem }
    ).ClipboardItem;

    if (!cardRef.current || !navigator.clipboard || !clipboardItemCtor) {
      setShareStatus("Clipboard image copy not supported on this browser.");
      return;
    }
    setIsProcessingShare(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((res) => resolve(res), "image/png"),
      );
      if (!blob) throw new Error("Failed to create blob");
      const item = new clipboardItemCtor({ "image/png": blob });
      await navigator.clipboard.write([item]);
      await onShare(post.id);
      setShareStatus("Copied! Drop it wherever the queens hang out.");
    } catch (error) {
      console.error("Clipboard copy failed", error);
      setShareStatus("Clipboard said nope. Maybe try download?");
    } finally {
      setIsProcessingShare(false);
    }
  }, [post.id, onShare]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) {
      setShareStatus("Native sharing unavailable on this device.");
      return;
    }
    setIsProcessingShare(true);
    try {
      await navigator.share({
        title: "Just dropped this on the SheFi Wall 👑",
        text: `"${post.text}" — ${post.isAnonymous ? "anonymous queen" : withHandle(post.signature)}`,
        url: `${window.location.origin}/post/${post.id}`,
      });
      await onShare(post.id);
      setShareStatus("Shared! The girls are gonna love this one.");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed", error);
        setShareStatus("Share was interrupted. Try again?");
      }
    } finally {
      setIsProcessingShare(false);
    }
  }, [post, onShare]);

  const handleTweet = useCallback(async () => {
    const tweet = encodeURIComponent(
      `just dropped this on the SheFi Wall 👑\n\n"${post.text}"\n\nshefiwall.xyz/post/${post.id}`,
    );
    const url = `https://twitter.com/intent/tweet?text=${tweet}`;
    window.open(url, "_blank", "noopener,noreferrer");
    await onShare(post.id);
    setShareStatus("Tweet draft ready! Tag the queens.");
  }, [post, onShare]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
      >
        <header className="flex items-center justify-between border-b border-[rgba(139,92,246,0.1)] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-shefi-ink-soft">Post-it drop</p>
            <h2 className="font-heading text-3xl text-shefi-purple">Spill replay</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[rgba(139,92,246,0.1)] px-4 py-2 text-sm font-semibold text-shefi-purple transition hover:bg-[rgba(139,92,246,0.2)]"
          >
            Close
          </button>
        </header>

        <main className="grid flex-1 gap-6 overflow-y-auto px-6 py-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <section className="flex flex-col gap-6">
            <div
              ref={cardRef}
              className="rounded-3xl p-8 shadow-[var(--shefi-card-shadow)]"
              style={getCardStyle(post.color)}
            >
              <p className="font-handwriting text-2xl text-shefi-ink">{post.text}</p>
              <footer className="mt-8 flex flex-col gap-2 font-sans text-sm text-shefi-ink-soft">
                <span>— {post.isAnonymous ? "anonymous queen" : withHandle(post.signature)}</span>
                <span className="text-xs uppercase tracking-[0.2em]">{formattedDate}</span>
              </footer>
              <div className="mt-6 flex items-center gap-3 text-base font-semibold text-shefi-purple">
                ❤️ {post.hearts}
                <button
                  type="button"
                  onClick={() => onHeart(post.id)}
                  className="rounded-full bg-[rgba(255,255,255,0.7)] px-3 py-1 text-xs uppercase tracking-[0.3em] text-shefi-purple shadow transition hover:bg-white"
                >
                  Heart it
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-shefi-ink-soft">
              <span role="img" aria-hidden>
                🏷️
              </span>
              Position on wall: #{post.position ?? 0}
              <span className="text-xs text-[rgba(109,74,139,0.7)]">·</span>
              Shares: {post.shares ?? 0}
            </div>

            <button
              type="button"
              onClick={() => onReport(post.id)}
              className="self-start rounded-full border border-[rgba(139,92,246,0.3)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-shefi-purple transition hover:border-shefi-purple hover:bg-[rgba(139,92,246,0.1)]"
            >
              Report · keep it classy
            </button>
          </section>

          <aside className="flex flex-col gap-4 rounded-3xl bg-[rgba(139,92,246,0.08)] p-4">
            <h3 className="font-heading text-xl text-shefi-purple">Share your wisdom</h3>
            {isOwn ? (
              <>
                <p className="text-sm text-shefi-ink-soft">
                  Download the post-it, copy it straight to clipboard, or blast a brag tweet. Sharing
                  adds a subtle watermark so queens know it came from the wall.
                </p>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isProcessingShare}
                  className="flex items-center justify-center gap-2 rounded-full bg-shefi-purple px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[rgba(139,92,246,0.9)] disabled:opacity-60"
                >
                  <span role="img" aria-hidden>
                    ⬇️
                  </span>
                  Download PNG
                </button>

                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={isProcessingShare}
                  className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-shefi-purple shadow transition hover:bg-[rgba(139,92,246,0.1)] disabled:opacity-60"
                >
                  <span role="img" aria-hidden>
                    📋
                  </span>
                  Copy image
                </button>

                <button
                  type="button"
                  onClick={handleTweet}
                  className="flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[rgba(0,0,0,0.8)]"
                >
                  <span role="img" aria-hidden>
                    🐦
                  </span>
                  Draft the tweet
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={!navigator.share || isProcessingShare}
                  className={clsx(
                    "flex items-center justify-center gap-2 rounded-full bg-shefi-blue px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[rgba(59,130,246,0.9)] disabled:opacity-60",
                    !navigator.share && "cursor-not-allowed",
                  )}
                >
                  <span role="img" aria-hidden>
                    📱
                  </span>
                  Share to Story
                </button>
              </>
            ) : (
              <p className="rounded-xl bg-[rgba(255,255,255,0.6)] p-4 text-sm text-shefi-ink-soft">
                Only the original queen can generate the share kit for this post-it. Tap the heart or
                leave your own!
              </p>
            )}

            <AnimatePresence>
              {shareStatus ? (
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="rounded-xl bg-[rgba(255,255,255,0.7)] p-3 text-xs font-semibold text-shefi-purple"
                >
                  {shareStatus}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </aside>
        </main>
      </motion.div>
    </motion.div>
  );
}

function withHandle(signature: string | null): string {
  if (!signature) return "anonymous queen";
  return signature.startsWith("@") ? signature : `@${signature}`;
}

function getCardStyle(color: string) {
  if (color.startsWith("linear-gradient") || color.startsWith("radial-gradient")) {
    return { background: color };
  }
  return { backgroundColor: color };
}
