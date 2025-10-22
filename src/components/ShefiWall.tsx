"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { describeCurrentVibe, getAvailableColors } from "@/lib/colors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { rememberPost, readPosts } from "@/lib/localPosts";
import type { PostIt } from "@/lib/types";
import PostItCard, { BoardPost } from "@/components/wall/PostItCard";
import CreatePostItModal from "@/components/wall/CreatePostItModal";
import PostItDetailModal from "@/components/wall/PostItDetailModal";
import FloatingActionButton from "@/components/wall/FloatingActionButton";
import SocialProofCounter from "@/components/wall/SocialProofCounter";
import RecentActivityToast from "@/components/wall/RecentActivityToast";
import { sdk } from "@farcaster/miniapp-sdk";

type ShefiWallProps = {
  initialPostIts: PostIt[];
  initialTotal: number;
  supabaseReady: boolean;
};

const masonryBreakpoints = {
  default: 5,
  1600: 4,
  1280: 4,
  1024: 3,
  768: 3,
  640: 2,
};

export default function ShefiWall({
  initialPostIts,
  initialTotal,
  supabaseReady,
}: ShefiWallProps) {
  const [postIts, setPostIts] = useState<BoardPost[]>(() =>
    mapInitial(initialPostIts),
  );
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [activityMessage, setActivityMessage] = useState<string | null>(null);
  const [isSupabaseReady, setIsSupabaseReady] = useState(supabaseReady);
  const [availableColors, setAvailableColors] = useState(() =>
    getAvailableColors(),
  );

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  const vibeMessage = useMemo(() => describeCurrentVibe(new Date()), []);

  useEffect(() => {
    const ticker = setInterval(() => {
      setAvailableColors(getAvailableColors());
    }, 60_000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    const mine = readPosts();
    setOwnedIds(mine);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsSupabaseReady(false);
      return;
    }
    setIsSupabaseReady(true);

    const channel = supabase
      .channel("shefi-wall")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "postit" },
        (payload) => {
          const newPost = payload.new as PostIt;
          let added = false;
          setPostIts((current) => {
            const existing = current.find((item) => item.id === newPost.id);

            if (existing) {
              return current.map((item) =>
                item.id === newPost.id
                  ? {
                      ...item,
                      ...newPost,
                      isFresh: true,
                      isOwn: ownedIds.includes(newPost.id) || item.isOwn,
                    }
                  : item,
              );
            }

            added = true;
            return [
              {
                ...newPost,
                isFresh: true,
                isOwn: ownedIds.includes(newPost.id),
              },
              ...current,
            ];
          });
          if (added) {
            setTotalCount((count) => count + 1);
          }
          setActivityMessage("A queen just posted something delicious. 👀");
          scheduleFreshReset(newPost.id, setPostIts);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "postit" },
        (payload) => {
          const updated = payload.new as PostIt;
          setPostIts((current) =>
            current.map((item) =>
              item.id === updated.id
                ? { ...item, ...updated, isOwn: ownedIds.includes(updated.id) }
                : item,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hearts" },
        (payload) => {
          const heart = payload.new as { postItId: string };
          setPostIts((current) =>
            current.map((item) =>
              item.id === heart.postItId
                ? { ...item, hearts: (item.hearts ?? 0) + 1 }
                : item,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownedIds]);

  const onHeart = useCallback(
    async (postId: string) => {
      setPostIts((current) =>
        current.map((item) =>
          item.id === postId ? { ...item, hearts: item.hearts + 1 } : item,
        ),
      );

      try {
        const response = await fetch(`/api/post-its/${postId}/heart`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Heart failed");
        }
      } catch (error) {
        console.error("Heart action failed", error);
      }
    },
    [setPostIts],
  );

  const onShare = useCallback(async (postId: string) => {
    try {
      await fetch(`/api/post-its/${postId}/share`, { method: "POST" });
      setPostIts((current) =>
        current.map((item) =>
          item.id === postId ? { ...item, shares: item.shares + 1 } : item,
        ),
      );
    } catch (error) {
      console.error("Share tracking failed", error);
    }
  }, []);

  const onReport = useCallback(async (postId: string) => {
    try {
      await fetch(`/api/post-its/${postId}/report`, {
        method: "POST",
      });
      setActivityMessage("Report received. Thanks for keeping the vibes high 💖");
    } catch (error) {
      console.error("Report failed", error);
    }
  }, []);

  const onCreatePost = useCallback(
    async (payload: { text: string; color: string; signature?: string | null; isAnonymous: boolean }) => {
      setIsSubmitting(true);
      setCreateError(null);

      try {
        const response = await fetch("/api/post-its", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody?.message ?? "That didn't stick, try again?");
        }

        const created: PostIt = await response.json();
        rememberPost(created.id);
        setOwnedIds((current) => [...new Set([...current, created.id])]);

        setPostIts((current) => [
          { ...created, isOwn: true, isFresh: true },
          ...current,
        ]);
        setTotalCount((count) => count + 1);
        setIsCreateOpen(false);
        fireConfetti();
        scheduleFreshReset(created.id, setPostIts);

        queueMicrotask(() => {
          listRef.current?.scrollIntoView({ behavior: "smooth" });
        });

        setActivityMessage("Your truth has been slapped! 💅");
        return created;
      } catch (error) {
        if (error instanceof Error) {
          setCreateError(error.message);
        } else {
          setCreateError("The wall is having a moment. Try again?");
        }
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const selectedPost = useMemo(
    () => postIts.find((post) => post.id === selectedPostId) ?? null,
    [postIts, selectedPostId],
  );

  return (
    <div className="min-h-screen bg-wall">
      <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <header className="mb-12 flex flex-col gap-6 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-sm uppercase tracking-[0.3em] text-shefi-blue">
                SheFi Wall
              </p>
              <h1 className="mt-2 font-heading text-4xl font-semibold text-shefi-purple sm:text-5xl">
                ✨ Where queens leave their marks
              </h1>
            </div>
            <div className="hidden sm:block">
              <SocialProofCounter count={totalCount} />
            </div>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-shefi-ink-soft sm:mx-0">
            Spill your tea, crown your wins, confess your crypto chaos. No logins, just vibes.
          </p>
          {vibeMessage ? (
            <p className="mx-auto max-w-sm rounded-full bg-[rgba(255,255,255,0.7)] px-5 py-2 text-sm font-medium text-shefi-blue shadow-sm ring-1 ring-[rgba(255,255,255,0.6)] sm:mx-0">
              {vibeMessage}
            </p>
          ) : null}
          <div className="sm:hidden">
            <SocialProofCounter count={totalCount} />
          </div>
        </header>

        <div className="mb-4 text-right text-xs text-shefi-ink-soft">
          Newest notes glow for a hot sec so you don&apos;t miss the fresh tea.
        </div>

        <div ref={listRef}>
          {postIts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(139,92,246,0.3)] bg-[rgba(255,255,255,0.6)] px-6 py-16 text-center font-heading text-xl text-shefi-ink-soft">
              <span role="img" aria-hidden className="mb-3 text-4xl">
                👑
              </span>
              <p>Be the first queen to leave her mark 👑</p>
              <p className="text-sm font-sans text-[rgba(109,74,139,0.8)]">
                The wall is waiting for your chaos...
              </p>
            </div>
          ) : (
            <Masonry
              breakpointCols={masonryBreakpoints}
              className="masonry-grid"
              columnClassName="masonry-grid_column"
            >
              {postIts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, translateY: -30 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "spring", damping: 18, stiffness: 120 }}
                >
                  <PostItCard
                    post={post}
                    onSelect={setSelectedPostId}
                    onHeart={onHeart}
                    isOwn={ownedIds.includes(post.id)}
                  />
                </motion.div>
              ))}
            </Masonry>
          )}
        </div>
      </div>

      <FloatingActionButton onClick={() => setIsCreateOpen(true)} />

      <AnimatePresence>
        {isCreateOpen ? (
          <CreatePostItModal
            key="create-modal"
            onClose={() => setIsCreateOpen(false)}
            onSubmit={onCreatePost}
            isSubmitting={isSubmitting}
            errorMessage={createError}
            availableColors={availableColors}
            supabaseReady={isSupabaseReady}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPost ? (
          <PostItDetailModal
            key={selectedPost.id}
            post={selectedPost}
            onClose={() => setSelectedPostId(null)}
            onHeart={onHeart}
            onShare={onShare}
            onReport={onReport}
            isOwn={ownedIds.includes(selectedPost.id)}
          />
        ) : null}
      </AnimatePresence>

      <RecentActivityToast
        message={activityMessage}
        onDismiss={() => setActivityMessage(null)}
      />
    </div>
  );
}

function mapInitial(posts: PostIt[]): BoardPost[] {
  return posts.map((post) => ({
    ...post,
    isOwn: false,
    isFresh: false,
  }));
}

function scheduleFreshReset(
  postId: string,
  setPosts: React.Dispatch<React.SetStateAction<BoardPost[]>>,
) {
  setTimeout(() => {
    setPosts((current) =>
      current.map((item) =>
        item.id === postId ? { ...item, isFresh: false } : item,
      ),
    );
  }, 8000);
}

function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#8b5cf6", "#ec4899", "#3b82f6", "#ffd6e8", "#fff3a3"],
  });
}
