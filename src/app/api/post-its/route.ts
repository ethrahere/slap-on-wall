import { NextRequest, NextResponse } from "next/server";
import { subHours, subDays } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validatePostText } from "@/lib/wordFilter";
import { hashIp } from "@/lib/hash";

const MAX_POSTS_PER_HOUR = 5;

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { postIts: [], total: 0, message: "Supabase is not configured yet." },
      { status: 200 },
    );
  }

  const { data, error, count } = await supabase
    .from("postit")
    .select(
      "id, text, color, signature, isAnonymous, createdAt, hearts, position, ipHash, shares",
      { count: "exact" },
    )
    .order("createdAt", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Failed to fetch post-its", error);
    return NextResponse.json({ message: "Failed to load post-its" }, { status: 500 });
  }

  return NextResponse.json({
    postIts: data ?? [],
    total: count ?? data?.length ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        message:
          "Supabase credentials missing. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to post.",
      },
      { status: 503 },
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",").shift()?.trim() ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0";
  const ipHash = hashIp(ip);

  const { text, color, signature, isAnonymous } = await request.json();
  const sanitized = typeof text === "string" ? text.trim() : "";
  const colorValue = typeof color === "string" ? color : "";
  const signatureValue =
    !isAnonymous && typeof signature === "string" && signature.trim().length > 0
      ? signature.replace(/^@/, "").trim()
      : null;

  const validation = validatePostText(sanitized);
  if (!validation.ok) {
    return NextResponse.json(
      { message: validation.reason ?? "Message rejected" },
      { status: 400 },
    );
  }

  if (!colorValue) {
    return NextResponse.json(
      { message: "Pick a color so the wall knows your vibe." },
      { status: 400 },
    );
  }

  const oneHourAgo = subHours(new Date(), 1).toISOString();
  const { data: recentPosts, error: recentError } = await supabase
    .from("postit")
    .select("id, createdAt")
    .eq("ipHash", ipHash)
    .gte("createdAt", oneHourAgo);

  if (recentError) {
    console.error("Rate limit lookup failed", recentError);
  } else if ((recentPosts?.length ?? 0) >= MAX_POSTS_PER_HOUR) {
    return NextResponse.json(
      {
        message:
          "Rate limit hit. Max 5 post-its per hour. Go sip some tea and try again soon.",
      },
      { status: 429 },
    );
  }

  const oneDayAgo = subDays(new Date(), 1).toISOString();
  const { data: duplicates, error: duplicateError } = await supabase
    .from("postit")
    .select("id")
    .eq("ipHash", ipHash)
    .eq("text", sanitized)
    .gte("createdAt", oneDayAgo);

  if (duplicateError) {
    console.error("Duplicate check failed", duplicateError);
  } else if (duplicates && duplicates.length > 0) {
    return NextResponse.json(
      {
        message: "No copy/paste twins within 24 hours. Remix it and try again.",
      },
      { status: 409 },
    );
  }

  const position = Date.now();

  const { data, error } = await supabase
    .from("postit")
    .insert({
      text: sanitized,
      color: colorValue,
      signature: signatureValue,
      isAnonymous: Boolean(isAnonymous ?? true),
      createdAt: new Date().toISOString(),
      hearts: 0,
      shares: 0,
      position,
      ipHash,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to insert post-it", error);
    return NextResponse.json(
      { message: "That didn’t stick! Give it another slap?" },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
