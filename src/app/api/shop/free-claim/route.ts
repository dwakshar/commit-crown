import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createClient } from "@/utils/supabase/server";

const freeClaimSchema = z.object({
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

  const parsed = freeClaimSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [
    { data: item, error: itemError },
    { data: existingOwnership, error: ownershipError },
  ] = await Promise.all([
    supabase
      .from("shop_items")
      .select("id")
      .eq("id", parsed.data.itemId)
      .maybeSingle(),
    supabase
      .from("owned_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_id", parsed.data.itemId)
      .maybeSingle(),
  ]);

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  if (ownershipError) {
    return NextResponse.json({ error: ownershipError.message }, { status: 500 });
  }

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (existingOwnership) {
    return NextResponse.json({ error: "Item already owned" }, { status: 409 });
  }

  const { error: insertError } = await supabaseAdmin.from("owned_items").upsert(
    {
      user_id: user.id,
      item_id: item.id,
    },
    { onConflict: "user_id,item_id", ignoreDuplicates: true }
  );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
