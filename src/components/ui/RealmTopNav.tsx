"use client";

import Link from "next/link";

export function RealmTopNav({
  active,
}: {
  active: "kingdom" | "marketplace" | "leaderboard";
}) {
  return (
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
            className={
              active === "kingdom"
                ? "text-[var(--silver-0)]"
                : "transition hover:text-[var(--silver-0)]"
            }>
            Game
          </Link>
          <Link
            href="/marketplace"
            className={
              active === "marketplace"
                ? "text-[var(--silver-0)]"
                : "transition hover:text-[var(--silver-0)]"
            }>
            Marketplace
          </Link>
          <Link
            href="/leaderboard"
            className={
              active === "leaderboard"
                ? "text-[var(--silver-0)]"
                : "transition hover:text-[var(--silver-0)]"
            }>
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
  );
}
