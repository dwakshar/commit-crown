import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createClient } from "@/utils/supabase/server";

type KingdomRow = {
  user_id: string;
  name: string | null;
  gold: number;
  defense_rating: number;
  prestige: number;
};

type ProfileRow = {
  username: string | null;
  avatar_url: string | null;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: kingdoms, error } = await supabaseAdmin
      .from("kingdoms")
      .select("user_id, name, gold, defense_rating, prestige")
      .neq("user_id", user.id)
      .order("prestige", { ascending: false })
      .limit(60);

    if (error || !kingdoms || kingdoms.length === 0) {
      return NextResponse.json(
        { error: "No rival kingdoms found" },
        { status: 404 }
      );
    }

    const rival = (kingdoms as KingdomRow[])[
      Math.floor(Math.random() * kingdoms.length)
    ];

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", rival.user_id)
      .maybeSingle();

    const { username, avatar_url } = (profile as ProfileRow | null) ?? {
      username: null,
      avatar_url: null,
    };

    return NextResponse.json({
      rival: {
        userId: rival.user_id,
        username: username ?? "Unknown",
        avatarUrl: avatar_url,
        kingdomName: rival.name ?? "Unnamed Kingdom",
        prestige: rival.prestige ?? 0,
        gold: rival.gold ?? 0,
        defenseRating: rival.defense_rating ?? 0,
      },
    });
  } catch (err) {
    console.error("[find-rival] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
