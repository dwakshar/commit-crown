import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { kingdom_name, raids_enabled } = body as {
    kingdom_name?: string;
    raids_enabled?: boolean;
  };

  if (kingdom_name !== undefined) {
    const trimmed = kingdom_name.trim();
    if (!trimmed || trimmed.length > 60) {
      return NextResponse.json(
        { error: "Kingdom name must be 1–60 characters" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("kingdoms")
      .update({ name: trimmed })
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (raids_enabled !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .update({ raids_enabled })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
