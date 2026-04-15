import { NextResponse } from "next/server";

import { tryEnsureKingdomForUser } from "@/src/lib/kingdomPersistence";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createClient } from "@/utils/supabase/server";

const CLAIM_AMOUNT = 50;
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const lastClaimAt: string | null = body?.lastClaimAt ?? null;

  // Server-side cooldown guard
  if (lastClaimAt) {
    const elapsed = Date.now() - new Date(lastClaimAt).getTime();
    if (elapsed < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        { error: "Claim not ready yet", remainingSeconds },
        { status: 400 }
      );
    }
  }

  const { data: fetched, error: fetchError } = await supabaseAdmin
    .from("kingdoms")
    .select("id, gold")
    .eq("user_id", user.id)
    .maybeSingle();

  let kingdom = fetched;

  if (fetchError || !kingdom) {
    const ensured = await tryEnsureKingdomForUser(user.id);
    if (!ensured) {
      return NextResponse.json({ error: "Kingdom not found" }, { status: 404 });
    }
    kingdom = { id: ensured.id, gold: ensured.gold };
  }

  const newGold = kingdom.gold + CLAIM_AMOUNT;

  const { error: updateError } = await supabaseAdmin
    .from("kingdoms")
    .update({ gold: newGold })
    .eq("id", kingdom.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to claim gold" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    gold: newGold,
    amount: CLAIM_AMOUNT,
    claimedAt: new Date().toISOString(),
  });
}
