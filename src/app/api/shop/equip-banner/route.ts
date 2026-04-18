import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

const schema = z.object({
  itemId: z.uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { itemId } = parsed.data;

  // Verify the user owns this item
  const { data: ownership, error: ownershipError } = await supabase
    .from("owned_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (ownershipError) {
    return NextResponse.json({ error: ownershipError.message }, { status: 500 });
  }

  if (!ownership) {
    return NextResponse.json({ error: "Item not owned" }, { status: 403 });
  }

  // Verify the item is a banner
  const { data: shopItem, error: itemError } = await supabase
    .from("shop_items")
    .select("id, type")
    .eq("id", itemId)
    .eq("type", "banner")
    .maybeSingle();

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  if (!shopItem) {
    return NextResponse.json({ error: "Banner item not found" }, { status: 404 });
  }

  // Check current equipped banner — toggle if already equipped
  const { data: kingdom, error: kingdomError } = await supabase
    .from("kingdoms")
    .select("equipped_banner_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (kingdomError) {
    return NextResponse.json({ error: kingdomError.message }, { status: 500 });
  }

  const isCurrentlyEquipped = (kingdom as { equipped_banner_id: string | null } | null)?.equipped_banner_id === itemId;
  const newBannerId = isCurrentlyEquipped ? null : itemId;

  const { error: updateError } = await supabase
    .from("kingdoms")
    .update({ equipped_banner_id: newBannerId })
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, equipped: !isCurrentlyEquipped });
}
