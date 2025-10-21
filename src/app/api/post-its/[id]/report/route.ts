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

  const { id } = await context.params;

  const ip =
    request.ip ??
    request.headers.get("x-forwarded-for")?.split(",").shift() ??
    "0.0.0.0";

  const ipHash = hashIp(ip);

  const { error } = await supabase.from("postitreports").insert({
    postItId: id,
    ipHash,
    createdAt: new Date().toISOString(),
  });

  if (error) {
    console.error("Report failed", error);
    return NextResponse.json(
      { message: "Could not send this report. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
