import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PostIt } from "@/lib/types";
import { SAMPLE_POSTS } from "@/lib/samplePosts";

type PostPageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = await fetchPost(params.id);
  if (!post) {
    return {
      title: "SheFi Wall · Post not found",
    };
  }

  const author = post.isAnonymous
    ? "anonymous queen"
    : post.signature?.startsWith("@")
    ? post.signature
    : `@${post.signature}`;

  return {
    title: `"${post.text.slice(0, 60)}..." · SheFi Wall`,
    description: `${post.text} — ${author}`,
    openGraph: {
      title: `SheFi Wall · ${author}`,
      description: post.text,
      url: `/post/${post.id}`,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await fetchPost(params.id);
  if (!post) {
    notFound();
  }

  const timestamp = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });
  const signatureLabel = post.isAnonymous
    ? "anonymous queen"
    : post.signature?.startsWith("@")
    ? post.signature
    : `@${post.signature}`;

  return (
    <div className="min-h-screen bg-wall px-4 py-20 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-shefi-ink-soft">
              SheFi Wall Reels It Back
            </p>
            <h1 className="mt-2 font-heading text-4xl text-shefi-purple">
              A queen&apos;s note from the wall
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-shefi-purple shadow transition hover:bg-[rgba(255,255,255,0.8)]"
          >
            <span role="img" aria-hidden>
              ⬅️
            </span>
            Back to wall
          </Link>
        </header>

        <div
          className="rounded-3xl p-10 shadow-[var(--shefi-card-shadow)]"
          style={getCardStyle(post.color)}
        >
          <p className="font-handwriting text-3xl leading-relaxed text-shefi-ink">{post.text}</p>
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 font-sans text-sm text-shefi-ink-soft">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">— {signatureLabel}</span>
              <span className="text-xs uppercase tracking-[0.3em]">{timestamp}</span>
            </div>
            <div className="flex items-center gap-4 text-base font-semibold text-shefi-purple">
              <span>❤️ {post.hearts}</span>
              <span>🔁 {post.shares}</span>
            </div>
          </footer>
        </div>

        <section className="rounded-3xl bg-[rgba(255,255,255,0.7)] p-6 font-sans text-sm text-shefi-ink-soft shadow-inner">
          <p>
            Want your own moment on the wall? Tap the floating button back on the{" "}
            <Link href="/" className="text-shefi-purple underline">
              main wall
            </Link>{" "}
            and slap your truth.
          </p>
        </section>
      </div>
    </div>
  );
}

async function fetchPost(id: string): Promise<PostIt | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return SAMPLE_POSTS.find((post) => post.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("postit")
    .select(
      "id, text, color, signature, isAnonymous, createdAt, hearts, position, ipHash, shares",
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch post for deep link", error);
    return null;
  }

  return data;
}

function getCardStyle(color: string) {
  if (color.startsWith("linear-gradient") || color.startsWith("radial-gradient")) {
    return { background: color };
  }
  return { backgroundColor: color };
}
