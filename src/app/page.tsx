import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PostIt } from "@/lib/types";
import ShefiWall from "@/components/ShefiWall";
import { SAMPLE_POSTS } from "@/lib/samplePosts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await getInitialWallData();

  return (
    <ShefiWall
      initialPostIts={initialData.postIts}
      initialTotal={initialData.total}
      supabaseReady={initialData.supabaseReady}
    />
  );
}

async function getInitialWallData(): Promise<{
  postIts: PostIt[];
  total: number;
  supabaseReady: boolean;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      postIts: SAMPLE_POSTS,
      total: SAMPLE_POSTS.length,
      supabaseReady: false,
    };
  }

  const { data, error, count } = await supabase
    .from("postit")
    .select(
      "id, text, color, signature, isAnonymous, createdAt, hearts, position, ipHash, shares",
      { count: "exact" },
    )
    .order("createdAt", { ascending: false })
    .limit(150);

  if (error) {
    console.error("Failed to load wall data from Supabase", error);
    return {
      postIts: SAMPLE_POSTS,
      total: SAMPLE_POSTS.length,
      supabaseReady: false,
    };
  }

  return {
    postIts: data ?? [],
    total: count ?? data?.length ?? 0,
    supabaseReady: true,
  };
}
