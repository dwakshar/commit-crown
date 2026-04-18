"use client";

import type { BannerDefinition } from "@/src/components/banners/types";
import type { MarketplaceItem } from "@/src/lib/shop";

export type BannerEntry = {
  banner: BannerDefinition;
  item: MarketplaceItem | null;
};

/**
 * Marketplace banner section — header bar + card grid.
 *
 * Driven entirely by the BANNERS registry in src/components/banners/index.ts.
 * Adding a new banner there is all that's needed; this component updates
 * automatically (count, season badge, cards).
 *
 * Props
 *   entries    — bannerEntries built in MarketplaceClient from BANNERS + DB items
 *   onInspect  — called with the banner's nameMatch when a card is clicked
 */
export function BannerSection({
  entries,
  onInspect,
}: {
  entries: BannerEntry[];
  onInspect: (nameMatch: string) => void;
}) {
  // Derive season label from the first registered banner that declares one.
  // When multiple seasons coexist you can adjust this logic (e.g. show all
  // unique seasons, or pick the most recently added banner's season).
  const seasonLabel = entries.find((e) => e.banner.season)?.banner.season;

  const count = entries.length;

  return (
    <section>
      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-4 border border-[var(--b0)] bg-[rgba(7,10,16,.62)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="realm-label text-[10px]">War Banners</p>
          <p className="mt-2 font-[var(--font-head)] text-sm uppercase tracking-[0.18em] text-[var(--silver-0)]">
            {count} relic{count !== 1 ? "s" : ""} available
          </p>
        </div>

        {seasonLabel && (
          <span className="border border-[rgba(212,168,48,.4)] bg-[rgba(212,168,48,.06)] px-3 py-1.5 font-[var(--font-head)] text-[10px] uppercase tracking-[0.2em] text-[#d4a830]">
            {seasonLabel}
          </span>
        )}
      </div>

      {/* ── Banner card grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(({ banner, item }) => (
          <banner.Card
            key={banner.nameMatch}
            item={item}
            onInspect={() => onInspect(banner.nameMatch)}
          />
        ))}
      </div>
    </section>
  );
}
