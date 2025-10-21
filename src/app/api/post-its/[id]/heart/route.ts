import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hashIp } from "@/lib/hash";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase not configured." },
      { status: 503 },
    );
  }

  const { id: postId } = await context.params;

  const ip =
    request.ip ??
    request.headers.get("x-forwarded-for")?.split(",").shift() ??
    "0.0.0.0";
  const ipHash = hashIp(ip);

  const { data: existing, error: existingError } = await supabase
    .from("hearts")
    .select("id")
    .eq("postItId", postId)
    .eq("ipHash", ipHash)
    .maybeSingle();

  if (existingError) {
    console.error("Heart lookup failed", existingError);
  }

  if (existing) {
    return NextResponse.json({ message: "Already hearted" }, { status: 200 });
  }

  const { error: insertError } = await supabase.from("hearts").insert({
    postItId: postId,
    ipHash,
    createdAt: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Failed to log heart", insertError);
    return NextResponse.json(
      { message: "The wall can’t process that heart right now." },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabase.rpc(
    "increment_hearts",
    {
      target_post_id: postId,
    },
  );

  if (updateError) {
    const { data: postData, error: postFetchError } = await supabase
      .from("postit")
      .select("hearts")
      .eq("id", postId)
      .single();

    if (postFetchError) {
      console.error("Heart update failed", updateError, postFetchError);
      return NextResponse.json(
        { message: "Heart logged but counter may be delayed." },
        { status: 202 },
      );
    }

    const { error: fallbackError } = await supabase
      .from("postit")
      .update({ hearts: (postData?.hearts ?? 0) + 1 })
      .eq("id", postId);

    if (fallbackError) {
      console.error("Heart update failed", updateError, fallbackError);
      return NextResponse.json(
        { message: "Heart logged but counter may be delayed." },
        { status: 202 },
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
