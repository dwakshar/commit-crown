import { redirect } from "next/navigation";

import { InventoryPageClient } from "@/src/components/ui/InventoryPageClient";
import { createClient } from "@/utils/supabase/server";

export default async function InventoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return <InventoryPageClient />;
}
