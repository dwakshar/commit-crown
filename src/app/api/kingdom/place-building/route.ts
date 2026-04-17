import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BUILDING_METADATA,
  isValidPlacementCoordinate,
  isWaterBuildingType,
} from "@/src/lib/kingdom";
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
    "royal_flagship",
    "sentinel_skiff",
    "bulwark_barge",
    "supply_tender",
  ]),
  position_x: z.number().int(),
  position_y: z.number().int(),
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

  if (
    !isValidPlacementCoordinate(
      parsed.data.type,
      parsed.data.position_x,
      parsed.data.position_y
    )
  ) {
    return NextResponse.json(
      { error: "Invalid placement position" },
      { status: 400 }
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "kingdoms(id, building_slots, gold, buildings(id, type, position_x, position_y))"
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

  if (isWaterBuildingType(parsed.data.type)) {
    const hasMatchingVessel = buildings.some((b) => b.type === parsed.data.type);
    if (hasMatchingVessel) {
      return NextResponse.json(
        { error: `${BUILDING_METADATA[parsed.data.type].label} already exists.` },
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

    if (transactionError.message.endsWith("already exists")) {
      return NextResponse.json(
        { error: transactionError.message },
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
