"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ShopItemCard } from "@/src/components/ui/ShopItemCard";
import { type MarketplaceItem, type ShopItemType } from "@/src/lib/shop";

type FilterType = "all" | ShopItemType;

const FILTERS: { id: FilterType; symbol: string; label: string }[] = [
  { id: "all", symbol: "◈", label: "All Relics" },
  { id: "building-skin", symbol: "▣", label: "Building Skins" },
  { id: "kingdom-theme", symbol: "◉", label: "Kingdom Themes" },
  { id: "banner", symbol: "⚑", label: "Banners" },
  { id: "profile-frame", symbol: "◻", label: "Profile Frames" },
];

export function InventoryPageClient() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/items", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: MarketplaceItem[] };
      setItems((data.items ?? []).filter((i) => i.owned));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const filtered =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  const count = (type: ShopItemType) =>
    items.filter((i) => i.type === type).length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#05070b_0%,#0b1018_100%)] text-[var(--silver-1)]">
      {/* ── Top navigation bar ─────────────────────────────────────────── */}
      <div className="border-b border-[var(--b1)] bg-[linear-gradient(180deg,rgba(3,4,6,0.98),rgba(8,11,16,0.94))]">
        <div className="flex h-[42px] items-center justify-between px-4 text-[11px] uppercase tracking-[0.28em] text-[var(--silver-3)]">
          <div className="flex items-center gap-2">
            <span className="realm-orb h-2 w-2" />
            <span className="realm-orb h-2 w-2 opacity-70" />
            <span className="realm-orb h-2 w-2 opacity-45" />
          </div>
          <div className="hidden items-center gap-12 md:flex">
            <Link
              href="/kingdom"
              className="transition hover:text-[var(--silver-0)]">
              Game
            </Link>
            <Link
              href="/marketplace"
              className="transition hover:text-[var(--silver-0)]">
              Marketplace
            </Link>
            <Link
              href="/leaderboard"
              className="transition hover:text-[var(--silver-0)]">
              Leaderboard
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="realm-orb h-2 w-2 opacity-45" />
            <span className="realm-orb h-2 w-2 opacity-70" />
            <span className="realm-orb h-2 w-2" />
          </div>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--b1)] bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,0.12),transparent_55%),linear-gradient(180deg,rgba(16,20,30,0.96),rgba(11,16,24,0.96))] px-6 py-12 md:px-20">
        <div className="mx-auto max-w-[1840px]">
          <p className="realm-label text-[var(--plate-hi)]">Royal Treasury</p>
          <h1 className="realm-page-title mt-4 text-[clamp(2.8rem,6vw,4.8rem)] font-bold leading-[0.92]">
            Vault Of <span className="text-[var(--ember)]">Relics</span>
          </h1>
          <p className="realm-lore mt-4 max-w-3xl text-base">
            Every cosmetic, theme, and treasure you have claimed or acquired for
            your realm. Equip items to transform your kingdom&apos;s appearance.
          </p>
        </div>
      </section>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--b1)] bg-[rgba(3,4,6,0.58)]">
        <div className="mx-auto grid max-w-[1840px] gap-4 px-6 py-6 md:grid-cols-4 md:px-9">
          <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
            <p className="realm-label">Total Relics</p>
            <p className="mt-3 font-[var(--font-display)] text-4xl text-[var(--silver-0)]">
              {loading ? "–" : items.length}
            </p>
          </div>
          <div className="border border-[rgba(200,88,26,0.24)] bg-[rgba(44,21,13,0.22)] px-5 py-5">
            <p className="realm-label text-[var(--ember-hi)]">Building Skins</p>
            <p className="mt-3 font-[var(--font-display)] text-4xl text-[#f2c97c]">
              {loading ? "–" : count("building-skin")}
            </p>
          </div>
          <div className="border border-[rgba(79,121,181,0.24)] bg-[rgba(16,22,50,0.22)] px-5 py-5">
            <p className="realm-label text-[#a0bcf0]">Kingdom Themes</p>
            <p className="mt-3 font-[var(--font-display)] text-4xl text-[#b9d4ff]">
              {loading ? "–" : count("kingdom-theme")}
            </p>
          </div>
          <div className="border border-[rgba(79,162,103,0.24)] bg-[rgba(16,50,22,0.22)] px-5 py-5">
            <p className="realm-label text-[#8ec8a0]">Claimed Free</p>
            <p className="mt-3 font-[var(--font-display)] text-4xl text-[#b7f0c5]">
              {loading ? "–" : items.filter((i) => i.isFree).length}
            </p>
          </div>
        </div>
      </section>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--b1)] bg-[rgba(3,4,6,0.58)]">
        <div className="mx-auto max-w-[1840px] px-6 py-4 md:px-9">
          <div className="flex items-center gap-2 overflow-x-auto">
            {FILTERS.map((f) => {
              const n =
                f.id === "all"
                  ? items.length
                  : items.filter((i) => i.type === f.id).length;
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`flex shrink-0 items-center gap-2 border px-4 py-2 text-[11px] uppercase tracking-[0.22em] transition ${
                    active
                      ? "border-[var(--ember)] bg-[rgba(44,21,13,0.6)] text-[var(--silver-0)]"
                      : "border-transparent text-[var(--silver-3)] hover:border-[var(--b1)] hover:text-[var(--silver-1)]"
                  }`}>
                  <span>{f.symbol}</span>
                  <span>{f.label}</span>
                  <span
                    className={`ml-1 tabular-nums ${
                      active
                        ? "text-[var(--ember-hi)]"
                        : "text-[var(--silver-4)]"
                    }`}>
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1840px] px-6 py-12 md:px-9">
        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse border border-[var(--b0)] bg-[rgba(255,255,255,0.02)]"
              />
            ))}
          </div>
        )}

        {/* Vault is completely empty */}
        {!loading && items.length === 0 && (
          <div className="realm-panel px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[var(--b1)] bg-[rgba(255,255,255,0.02)] font-[var(--font-head)] text-xl text-[var(--silver-3)]">
              ◈
            </div>
            <h2 className="mt-6 font-[var(--font-head)] text-3xl text-[var(--silver-0)]">
              Your Vault Is Empty
            </h2>
            <p className="realm-lore mx-auto mt-4 max-w-xl text-base">
              No relics have been acquired yet. Visit the Marketplace to claim
              free cosmetics or purchase new ones for your kingdom.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/marketplace"
                className="realm-button realm-button-secondary px-6 py-3">
                Browse Marketplace
              </Link>
            </div>
          </div>
        )}

        {/* Filter returns no results but vault has items */}
        {!loading && items.length > 0 && filtered.length === 0 && (
          <div className="realm-panel px-6 py-14 text-center">
            <p className="realm-label text-[var(--plate-hi)]">No Results</p>
            <h2 className="mt-4 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
              No {FILTERS.find((f) => f.id === filter)?.label ?? "items"} in
              your vault
            </h2>
            <p className="realm-lore mt-3 text-base">
              Try a different filter or visit the Marketplace to acquire more.
            </p>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="realm-button realm-button-secondary mt-6 px-5 py-2.5">
              Show All
            </button>
          </div>
        )}

        {/* Item grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                onRefreshRequested={fetchItems}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--b0)] pt-8 sm:flex-row">
          <p className="text-sm text-[var(--silver-3)]">
            {!loading && (
              <>
                {filtered.length} {filtered.length === 1 ? "relic" : "relics"}
                {filter !== "all" && (
                  <> · {FILTERS.find((f) => f.id === filter)?.label}</>
                )}
              </>
            )}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="realm-button realm-button-secondary px-4 py-3">
              Marketplace
            </Link>
            <Link
              href="/kingdom"
              className="realm-button realm-button-secondary px-4 py-3">
              Return To Kingdom
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
