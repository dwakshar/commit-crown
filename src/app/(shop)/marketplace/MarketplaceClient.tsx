"use client";

import { useState } from "react";

import Link from "next/link";

import { BANNERS } from "@/src/components/banners";
import { BannerSection } from "@/src/components/banners/BannerSection";
import { RealmTopNav } from "@/src/components/ui/RealmTopNav";
import type { MarketplaceItem } from "@/src/lib/shop";

export function MarketplaceClient({
  initialItems,
}: {
  initialItems: MarketplaceItem[];
}) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Match each registered banner to its DB item (if one exists)
  const bannerEntries = BANNERS.map((banner) => ({
    banner,
    item:
      initialItems.find(
        (i) =>
          i.type === "banner" && i.name.toLowerCase().includes(banner.nameMatch)
      ) ?? null,
  }));

  const activeBannerEntry = bannerEntries.find(
    (e) => e.banner.nameMatch === activeModal
  );

  const totalOwned = bannerEntries.filter((e) => e.item?.owned).length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#05070b_0%,#0b1018_100%)] text-[var(--silver-1)]">
      <div>
        <RealmTopNav active="marketplace" />
      </div>

      {/* Hero */}
      <section className="border-b border-[var(--b1)] bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,.12),transparent_55%),linear-gradient(180deg,rgba(16,20,30,.96),rgba(11,16,24,.96))] px-6 py-12 md:px-20">
        <div className="mx-auto flex max-w-[1840px] flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="realm-label text-[var(--plate-hi)]">
              Exchange &amp; Acquisition
            </p>
            <h1 className="realm-page-title mt-4 text-[clamp(2.8rem,6vw,4.8rem)] font-bold leading-[0.92]">
              The Grand <span className="text-[var(--ember)]">Bazaar</span>
            </h1>
            <p className="realm-lore mt-4 max-w-3xl text-base">
              Exclusive cosmetics for your kingdom. Claim what is yours.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Relics Available",
                value: String(bannerEntries.length),
              },
              { label: "Your Vault", value: String(totalOwned) },
              { label: "Rarity", value: "Exclusive" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="border border-[var(--b1)] bg-[rgba(7,10,16,.72)] px-5 py-4">
                <p className="realm-label text-[10px]">{label}</p>
                <p className="mt-2 font-[var(--font-display)] text-3xl text-[var(--silver-0)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-[1840px] px-6 py-10 md:px-9">
        <div className="grid gap-7 xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="h-fit border border-[var(--b0)] bg-[linear-gradient(180deg,rgba(5,8,12,.94),rgba(7,10,16,.98))]">
            <div className="border-b border-[var(--b1)] px-5 py-5">
              <p className="realm-label text-[10px]">Browse Houses</p>
              <p className="mt-2 font-[var(--font-head)] text-sm uppercase tracking-[0.16em] text-[var(--silver-0)]">
                Collections
              </p>
            </div>

            <div className="divide-y divide-[rgba(80,105,130,.08)]">
              <div className="flex w-full items-center justify-between gap-3 bg-[linear-gradient(90deg,rgba(200,88,26,.1),transparent)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center border border-[rgba(200,88,26,.55)] font-[var(--font-head)] text-[10px] uppercase tracking-[0.12em] text-[var(--ember-hi)]">
                    BN
                  </span>
                  <div>
                    <p className="font-[var(--font-head)] text-[11px] uppercase tracking-[0.16em] text-[var(--silver-0)]">
                      Banners
                    </p>
                    <p className="mt-1 text-[11px] italic text-[var(--silver-3)]">
                      War banners
                    </p>
                  </div>
                </div>
                <span className="border border-[var(--b1)] px-2 py-1 text-[10px] text-[var(--silver-3)]">
                  {bannerEntries.length}
                </span>
              </div>
            </div>

            <div className="border-t border-[var(--b1)] px-5 py-5">
              <p className="realm-label text-[10px]">Your Vault</p>
              <p className="mt-3 text-sm text-[var(--silver-2)]">
                {totalOwned} item{totalOwned !== 1 ? "s" : ""} owned
              </p>
              <p className="mt-1 text-xs italic text-[var(--silver-3)]">
                Collection synced with your realm.
              </p>
            </div>
          </aside>

          {/* Grid */}
          <BannerSection
            entries={bannerEntries}
            onInspect={(nameMatch) => setActiveModal(nameMatch)}
          />
        </div>

        <div className="mt-10 flex justify-end">
          <Link
            href="/kingdom"
            className="realm-button realm-button-secondary border border-[var(--b1)] px-4 py-3">
            Return to Kingdom
          </Link>
        </div>
      </div>

      {/* Active modal */}
      {activeBannerEntry && (
        <activeBannerEntry.banner.Modal
          item={activeBannerEntry.item}
          onClose={() => setActiveModal(null)}
        />
      )}
    </main>
  );
}
