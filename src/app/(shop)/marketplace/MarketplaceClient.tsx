"use client";

import { useEffect, useMemo, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { RealmTopNav } from "@/src/components/ui/RealmTopNav";
import { ShopItemCard } from "@/src/components/ui/ShopItemCard";
import { useNotificationStore } from "@/src/store/notificationStore";

import { formatPrice, type MarketplaceItem, type ShopItemType } from "@/src/lib/shop";

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

type SortOption = "newest" | "price-asc" | "price-desc" | "rarity";

const FILTER_META: Record<
  (typeof FILTERS)[number]["value"],
  { eyebrow: string; symbol: string }
> = {
  all: { eyebrow: "All relics", symbol: "AL" },
  "building-skin": { eyebrow: "Forged facades", symbol: "BS" },
  "kingdom-theme": { eyebrow: "Realm themes", symbol: "KT" },
  banner: { eyebrow: "War banners", symbol: "BN" },
  "profile-frame": { eyebrow: "Sigil frames", symbol: "PF" },
};

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  "price-asc": "Price Up",
  "price-desc": "Price Down",
  rarity: "Rarity",
};

export function MarketplaceClient({
  initialItems,
}: {
  initialItems: MarketplaceItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [activeFilter, setActiveFilter] = useState<"all" | ShopItemType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
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
    const filtered = items.filter(
      (item) => activeFilter === "all" || item.type === activeFilter
    );

    if (sortBy === "newest") {
      return filtered;
    }

    return [...filtered].sort((left, right) => {
      if (sortBy === "price-asc") {
        return left.priceCents - right.priceCents;
      }

      if (sortBy === "price-desc") {
        return right.priceCents - left.priceCents;
      }

      if (sortBy === "rarity") {
        const rarityScore = (item: MarketplaceItem) =>
          Number(item.owned) * 3 + Number(item.equipped) * 4 + Number(!item.isFree);
        return rarityScore(right) - rarityScore(left);
      }

      return 0;
    });
  }, [activeFilter, items, sortBy]);

  const filterCounts = useMemo(() => {
    return FILTERS.reduce<Record<(typeof FILTERS)[number]["value"], number>>(
      (counts, filter) => {
        counts[filter.value] =
          filter.value === "all"
            ? items.length
            : items.filter((item) => item.type === filter.value).length;
        return counts;
      },
      {
        all: 0,
        "building-skin": 0,
        "kingdom-theme": 0,
        banner: 0,
        "profile-frame": 0,
      }
    );
  }, [items]);

  const ownedCount = useMemo(
    () => items.filter((item) => item.owned).length,
    [items]
  );

  const treasuryValue = useMemo(
    () =>
      items
        .filter((item) => item.owned && !item.isFree)
        .reduce((total, item) => total + item.priceCents, 0),
    [items]
  );

  const heroLead =
    activeFilter === "all"
      ? "Adorn your kingdom with relics, banners, frames, and themes forged for glory."
      : `Curated ${FILTER_META[activeFilter].eyebrow.toLowerCase()} ready for your realm.`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#05070b_0%,#0b1018_100%)] text-[var(--silver-1)]">
      <div>
        <RealmTopNav active="marketplace" />
      </div>

      <section className="border-b border-[var(--b1)] bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,0.12),transparent_55%),linear-gradient(180deg,rgba(16,20,30,0.96),rgba(11,16,24,0.96))] px-6 py-12 md:px-20">
        <div className="mx-auto flex max-w-[1840px] flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="realm-label text-[var(--plate-hi)]">
              Exchange &amp; Acquisition
            </p>
            <h1 className="realm-page-title mt-4 text-[clamp(2.8rem,6vw,4.8rem)] font-bold leading-[0.92]">
              The Grand <span className="text-[var(--ember)]">Bazaar</span>
            </h1>
            <p className="realm-lore mt-4 max-w-3xl text-base">{heroLead}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-[var(--b1)] bg-[rgba(7,10,16,0.72)] px-5 py-4">
              <p className="realm-label text-[10px]">Relics Available</p>
              <p className="mt-2 font-[var(--font-display)] text-3xl text-[var(--silver-0)]">
                {filteredItems.length}
              </p>
            </div>
            <div className="border border-[var(--b1)] bg-[rgba(7,10,16,0.72)] px-5 py-4">
              <p className="realm-label text-[10px]">Your Vault</p>
              <p className="mt-2 font-[var(--font-display)] text-3xl text-[var(--silver-0)]">
                {ownedCount}
              </p>
            </div>
            <div className="border border-[var(--b1)] bg-[rgba(7,10,16,0.72)] px-5 py-4">
              <p className="realm-label text-[10px]">Treasury Value</p>
              <p className="mt-2 font-[var(--font-display)] text-3xl text-[var(--silver-0)]">
                {formatPrice(treasuryValue, treasuryValue <= 0)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--b1)] bg-[rgba(3,4,6,0.58)]">
        <div className="mx-auto flex max-w-[1840px] overflow-x-auto px-6 md:px-9">
          {FILTERS.map((filter) => {
            const isActive = filter.value === activeFilter;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`border-b-2 px-6 py-4 font-[var(--font-head)] text-[12px] uppercase tracking-[0.16em] transition ${
                  isActive
                    ? "border-[var(--ember)] text-[var(--silver-0)]"
                    : "border-transparent text-[var(--silver-3)] hover:text-[var(--silver-1)]"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mx-auto max-w-[1840px] px-6 py-10 md:px-9">
        <div className="grid gap-7 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit border border-[var(--b0)] bg-[linear-gradient(180deg,rgba(5,8,12,0.94),rgba(7,10,16,0.98))]">
            <div className="border-b border-[var(--b1)] px-5 py-5">
              <p className="realm-label text-[10px]">Browse Houses</p>
              <p className="mt-2 font-[var(--font-head)] text-sm uppercase tracking-[0.16em] text-[var(--silver-0)]">
                Curated collections
              </p>
            </div>

            <div className="divide-y divide-[rgba(80,105,130,0.08)]">
              {FILTERS.map((filter) => {
                const isActive = filter.value === activeFilter;
                const meta = FILTER_META[filter.value];

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition ${
                      isActive
                        ? "bg-[linear-gradient(90deg,rgba(200,88,26,0.14),transparent)]"
                        : "hover:bg-[rgba(255,255,255,0.02)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center border font-[var(--font-head)] text-[10px] uppercase tracking-[0.12em] ${
                          isActive
                            ? "border-[rgba(200,88,26,0.55)] text-[var(--ember-hi)]"
                            : "border-[var(--b1)] text-[var(--silver-3)]"
                        }`}
                      >
                        {meta.symbol}
                      </span>
                      <div>
                        <p
                          className={`font-[var(--font-head)] text-[11px] uppercase tracking-[0.16em] ${
                            isActive
                              ? "text-[var(--silver-0)]"
                              : "text-[var(--silver-2)]"
                          }`}
                        >
                          {filter.label}
                        </p>
                        <p className="mt-1 text-[11px] italic text-[var(--silver-3)]">
                          {meta.eyebrow}
                        </p>
                      </div>
                    </div>
                    <span className="border border-[var(--b1)] px-2 py-1 text-[10px] text-[var(--silver-3)]">
                      {filterCounts[filter.value]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[var(--b1)] px-5 py-5">
              <p className="realm-label text-[10px]">Your Vault</p>
              <p className="mt-3 text-sm text-[var(--silver-2)]">
                {ownedCount} items owned
              </p>
              <p className="mt-1 text-xs italic text-[var(--silver-3)]">
                {isRefreshing ? "Refreshing inventory..." : "Collection synced with your realm."}
              </p>
            </div>
          </aside>

          <section>
            <div className="mb-5 flex flex-col gap-4 border border-[var(--b0)] bg-[rgba(7,10,16,0.62)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="realm-label text-[10px]">
                  {FILTER_META[activeFilter].eyebrow}
                </p>
                <p className="mt-2 font-[var(--font-head)] text-sm uppercase tracking-[0.18em] text-[var(--silver-0)]">
                  {filteredItems.length} relics available
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((sort) => {
                  const isActive = sortBy === sort;

                  return (
                    <button
                      key={sort}
                      type="button"
                      onClick={() => setSortBy(sort)}
                      className={`realm-button border px-4 py-2 text-[11px] ${
                        isActive
                          ? "border-[var(--ember)] bg-[rgba(44,21,13,0.72)] text-[var(--ember)]"
                          : "border-[var(--b1)] bg-transparent text-[var(--silver-3)] hover:text-[var(--silver-1)]"
                      }`}
                    >
                      {SORT_LABELS[sort]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredItems.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  onRefreshRequested={refreshItems}
                />
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <div className="border border-dashed border-[var(--b1)] bg-[rgba(255,255,255,0.03)] px-6 py-12 text-center text-[var(--silver-2)]">
                No items match this collection yet.
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
