"use client";

import { useEffect, useMemo, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { RealmTopNav } from "@/src/components/ui/RealmTopNav";
import { ShopItemCard } from "@/src/components/ui/ShopItemCard";
import { useNotificationStore } from "@/src/store/notificationStore";

import type { MarketplaceItem, ShopItemType } from "@/src/lib/shop";

type MarketplaceItemsResponse = {
  items: MarketplaceItem[];
  error?: string;
};

const FILTERS: Array<{ value: "all" | ShopItemType; label: string }> = [
  { value: "all", label: "All" },
  { value: "building-skin", label: "Building Skins" },
  { value: "kingdom-theme", label: "Kingdom Themes" },
  { value: "banner", label: "Banners" },
  { value: "profile-frame", label: "Profile Frames" },
];

export function MarketplaceClient({
  initialItems,
}: {
  initialItems: MarketplaceItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [activeFilter, setActiveFilter] = useState<"all" | ShopItemType>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const refreshItems = async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/shop/items", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const payload = (await response.json()) as MarketplaceItemsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to refresh marketplace items");
      }

      setItems(payload.items);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("success") !== "true") {
      return;
    }

    addNotification({
      id: `purchase-complete-${Date.now()}`,
      user_id: "local",
      type: "purchase_complete",
      message: "Purchase complete!",
      data: null,
      read_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    void refreshItems();
    router.replace(pathname, { scroll: false });
  }, [addNotification, pathname, router, searchParams]);

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) => activeFilter === "all" || item.type === activeFilter
    );
  }, [activeFilter, items]);

  return (
    <main className="min-h-screen px-4 py-10 text-[var(--silver-1)] sm:px-6 lg:px-8">
      <div className="mx-[-1rem] mt-[-2.5rem] mb-10 sm:mx-[-1.5rem] lg:mx-[-2rem]">
        <RealmTopNav active="marketplace" />
      </div>
      <div className="mx-auto max-w-7xl">
        <section className="realm-panel rounded-[32px] p-5 sm:p-8">
          <div className="flex flex-col gap-5 border-b border-[var(--b0)] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="realm-label text-[var(--plate-hi)]">
                CodeKingdom Marketplace
              </p>
              <h1 className="realm-page-title mt-3 text-3xl sm:text-4xl">
                Outfit the realm with rare cosmetics
              </h1>
              <p className="realm-lore mt-3 max-w-3xl text-sm sm:text-base">
                Claim free rewards, purchase premium drops, and equip skins or
                themes for your kingdom.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--b1)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--silver-2)]">
              <span className="text-[var(--ember-hi)]">{filteredItems.length}</span>{" "}
              items
              {isRefreshing ? " - refreshing" : ""}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {FILTERS.map((filter) => {
              const isActive = filter.value === activeFilter;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={[
                    "realm-button rounded-[16px] border px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "realm-button-primary"
                      : "realm-button-secondary",
                  ].join(" ")}>
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                onRefreshRequested={refreshItems}
              />
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="mt-8 rounded-[28px] border border-dashed border-[var(--b1)] bg-[rgba(255,255,255,0.03)] px-6 py-12 text-center text-[var(--silver-2)]">
              No items match this filter yet.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
