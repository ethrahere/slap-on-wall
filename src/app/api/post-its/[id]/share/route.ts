import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase not configured." },
      { status: 503 },
    );
  }

  const { id } = await context.params;

  const { data, error } = await supabase
    .from("postit")
    .select("shares")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Share lookup failed", error);
    return NextResponse.json(
      { message: "Unable to increment shares." },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabase
    .from("postit")
    .update({ shares: (data?.shares ?? 0) + 1 })
    .eq("id", id);

  if (updateError) {
    console.error("Share update failed", updateError);
    return NextResponse.json(
      { message: "Share recorded but counter might lag." },
      { status: 202 },
    );
  }

  return NextResponse.json({ ok: true });
}
