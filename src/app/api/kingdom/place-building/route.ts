import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BUILDING_UNLOCK_REQUIREMENTS,
  type GitHubStats,
} from "@/src/lib/gameEngine";
import { BUILDING_METADATA } from "@/src/lib/kingdom";
import { ensureKingdomForUser } from "@/src/lib/kingdomPersistence";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import type { BuildingType } from "@/src/types/game";
import { createClient } from "@/utils/supabase/server";

const placeBuildingSchema = z.object({
  type: z.enum([
    "town_hall",
    "arcane_tower",
    "library",
    "iron_forge",
    "barracks",
    "observatory",
    "market",
    "wall",
    "monument",
  ]),
  position_x: z.number().int().min(0).max(19),
  position_y: z.number().int().min(0).max(19),
});

type PlaceBuildingTransactionRow = {
  building_id: string
  kingdom_id: string
  type: BuildingType
  level: number
  position_x: number
  position_y: number
  built_at: string
  gold: number
}

type ProfileQueryResult = {
  kingdoms:
    | {
        id: string;
        building_slots: number;
        gold: number;
        buildings:
          | {
              id: string;
              type: BuildingType;
              position_x: number;
              position_y: number;
            }[]
          | null;
      }[]
    | null;
  github_stats:
    | {
        total_commits: number;
        total_repos: number;
        total_stars: number;
        total_prs: number;
        followers: number;
        current_streak: number;
        longest_streak: number;
        languages: Record<string, number> | null;
      }[]
    | null;
};

type EnsuredKingdom = {
  id: string;
  building_slots: number;
  gold: number;
  buildings:
    | {
        id: string;
        type: BuildingType;
        position_x: number;
        position_y: number;
      }[]
    | null;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = placeBuildingSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "kingdoms(id, building_slots, gold, buildings(id, type, position_x, position_y)), github_stats(total_commits, total_repos, total_stars, total_prs, followers, current_streak, longest_streak, languages)"
    )
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const result = profile as ProfileQueryResult;
  let kingdom = result.kingdoms?.[0] ?? null;

  if (!kingdom) {
    try {
      const ensuredKingdom = await ensureKingdomForUser(user.id);

      if (!ensuredKingdom) {
        return NextResponse.json(
          { error: "Kingdom not found" },
          { status: 404 }
        );
      }

      kingdom = {
        id: ensuredKingdom.id,
        building_slots: ensuredKingdom.building_slots,
        gold: ensuredKingdom.gold ?? 0,
        buildings: (ensuredKingdom.buildings ?? []).map((building) => ({
          id: building.id,
          type: building.type,
          position_x: building.position_x,
          position_y: building.position_y,
        })),
      } satisfies EnsuredKingdom;
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Unable to initialize kingdom",
        },
        { status: 500 }
      );
    }
  }

  const buildings = kingdom.buildings ?? [];

  if (parsed.data.type === "town_hall") {
    const hasTownHall = buildings.some((b) => b.type === "town_hall");

    if (hasTownHall) {
      return NextResponse.json(
        { error: "Town Hall already exists. You can only have one." },
        { status: 400 }
      );
    }
  }

  const occupied = buildings.some(
    (building) =>
      building.position_x === parsed.data.position_x &&
      building.position_y === parsed.data.position_y
  );

  if (occupied) {
    return NextResponse.json(
      { error: "Position is already occupied" },
      { status: 400 }
    );
  }

  if (buildings.length >= kingdom.building_slots) {
    return NextResponse.json(
      { error: "No building slots available" },
      { status: 400 }
    );
  }

  const statsRow = result.github_stats?.[0];
  const githubStats: GitHubStats = {
    total_commits: statsRow?.total_commits ?? 0,
    total_repos: statsRow?.total_repos ?? 0,
    total_stars: statsRow?.total_stars ?? 0,
    total_prs: statsRow?.total_prs ?? 0,
    followers: statsRow?.followers ?? 0,
    current_streak: statsRow?.current_streak ?? 0,
    longest_streak: statsRow?.longest_streak ?? 0,
    languages: statsRow?.languages ?? {},
  };

  const unlockRequirement = BUILDING_UNLOCK_REQUIREMENTS[parsed.data.type];
  if (
    typeof unlockRequirement === "function" &&
    !unlockRequirement(githubStats)
  ) {
    return NextResponse.json(
      { error: "Building type is locked" },
      { status: 400 }
    );
  }

  const placementCost = BUILDING_METADATA[parsed.data.type].baseCost;

  if (kingdom.gold < placementCost) {
    return NextResponse.json(
      {
        error: `Insufficient gold. Building requires ${placementCost} gold (you have ${kingdom.gold}).`,
      },
      { status: 400 }
    );
  }

  // Use an atomic transaction to place the building and deduct gold together,
  // preventing races where two concurrent requests could both pass the gold check.
  const { data: transactionData, error: transactionError } =
    await supabaseAdmin.rpc("place_building_transaction", {
      p_user_id: user.id,
      p_type: parsed.data.type,
      p_position_x: parsed.data.position_x,
      p_position_y: parsed.data.position_y,
      p_cost: placementCost,
    });

  if (transactionError) {
    if (transactionError.message === "Position is already occupied") {
      return NextResponse.json(
        { error: "Position is already occupied" },
        { status: 400 }
      );
    }

    if (transactionError.message === "No building slots available") {
      return NextResponse.json(
        { error: "No building slots available" },
        { status: 400 }
      );
    }

    if (transactionError.message.startsWith("Insufficient gold")) {
      return NextResponse.json(
        { error: "Insufficient gold" },
        { status: 400 }
      );
    }

    if (transactionError.message === "Town Hall already exists") {
      return NextResponse.json(
        { error: "Town Hall already exists. You can only have one." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: transactionError.message ?? "Unable to place building" },
      { status: 500 }
    );
  }

  const placed = (transactionData?.[0] as PlaceBuildingTransactionRow | undefined) ?? null;

  if (!placed) {
    return NextResponse.json({ error: "Unable to place building" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    building: {
      id: placed.building_id,
      kingdom_id: placed.kingdom_id,
      type: placed.type,
      level: placed.level,
      position_x: placed.position_x,
      position_y: placed.position_y,
      built_at: placed.built_at,
    },
    gold: placed.gold,
  });
}
