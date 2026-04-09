import Link from "next/link";
import { redirect } from "next/navigation";

import { LeaderboardTable } from "@/src/components/social/LeaderboardTable";
import { createClient } from "@/utils/supabase/server";

type SearchParams = Promise<{ tab?: string; page?: string }>;

type LeaderboardRow = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  kingdom_name: string;
  prestige: number;
  raid_wins: number;
  languages?: Record<string, number> | null;
  top_language?: string | null;
};

function extractTopLanguage(row: LeaderboardRow) {
  if (row.top_language) {
    return row.top_language;
  }

  return (
    Object.entries(row.languages ?? {}).sort(([, a], [, b]) => b - a)[0]?.[0] ??
    "Unknown"
  );
}

function getPodiumRows(rows: LeaderboardRow[]) {
  return rows.slice(0, 3);
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab = "global", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page || "1"));
  const from = (currentPage - 1) * 25;
  const to = from + 24;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const queryMap = {
    global: () =>
      supabase
        .from("leaderboard_global")
        .select("*", { count: "exact" })
        .order("prestige", { ascending: false })
        .range(from, to),
    language: () =>
      supabase
        .from("leaderboard_by_language")
        .select("*", { count: "exact" })
        .order("prestige", { ascending: false })
        .range(from, to),
    weekly: () =>
      supabase
        .from("leaderboard_weekly")
        .select("*", { count: "exact" })
        .order("weekly_gold_gained", { ascending: false })
        .range(from, to),
  };

  const selectedTab =
    tab in queryMap ? (tab as keyof typeof queryMap) : "global";
  const { data, count } = await queryMap[selectedTab]();

  const rows = ((data as LeaderboardRow[] | null) ?? []).map((row) => ({
    ...row,
    top_language: extractTopLanguage(row),
  }));
  const podiumRows = getPodiumRows(rows);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#05070b_0%,#0b1018_100%)] text-[var(--silver-1)]">
      <div className="border-b border-[var(--b1)] bg-[linear-gradient(180deg,rgba(3,4,6,0.98),rgba(8,11,16,0.94))]">
        <div className="flex h-[42px] items-center justify-between px-4 text-[11px] uppercase tracking-[0.28em] text-[var(--silver-3)]">
          <div className="flex items-center gap-2">
            <span className="realm-orb h-2 w-2 rounded-full" />
            <span className="realm-orb h-2 w-2 rounded-full opacity-70" />
            <span className="realm-orb h-2 w-2 rounded-full opacity-45" />
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
            <span className="text-[var(--silver-0)]">Leaderboard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="realm-orb h-2 w-2 rounded-full opacity-45" />
            <span className="realm-orb h-2 w-2 rounded-full opacity-70" />
            <span className="realm-orb h-2 w-2 rounded-full" />
          </div>
        </div>
      </div>

      <section className="border-b border-[var(--b1)] bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,0.12),transparent_55%),linear-gradient(180deg,rgba(16,20,30,0.96),rgba(11,16,24,0.96))] px-6 py-12 md:px-20">
        <div className="mx-auto max-w-[1840px]">
          <p className="realm-label text-[var(--plate-hi)]">
            Glory &amp; Conquest
          </p>
          <h1 className="realm-page-title mt-4 text-[clamp(2.8rem,6vw,4.8rem)] font-bold leading-[0.92]">
            Hall Of <span className="text-[var(--ember)]">Legend</span>
          </h1>
          <p className="realm-lore mt-4 max-w-3xl text-base">
            The mightiest kingdoms in the realm, ranked by prestige and
            conquest.
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--b1)] bg-[rgba(3,4,6,0.58)]">
        <div className="mx-auto flex max-w-[1840px] overflow-x-auto px-6 md:px-9">
          {[
            { key: "global", label: "Global Prestige" },
            { key: "language", label: "By Language" },
            { key: "weekly", label: "Weekly Conquest" },
            { key: "feared", label: "Most Feared", disabled: true },
          ].map((tabItem) => {
            const isCurrent = selectedTab === tabItem.key;

            if ("disabled" in tabItem && tabItem.disabled) {
              return (
                <span
                  key={tabItem.key}
                  className="border-b-2 border-transparent px-6 py-4 font-[var(--font-head)] text-[12px] uppercase tracking-[0.16em] text-[var(--silver-3)] opacity-70">
                  {tabItem.label}
                </span>
              );
            }

            return (
              <Link
                key={tabItem.key}
                href={`/leaderboard?tab=${tabItem.key}&page=1`}
                className={`border-b-2 px-6 py-4 font-[var(--font-head)] text-[12px] uppercase tracking-[0.16em] transition ${
                  isCurrent
                    ? "border-[var(--ember)] text-[var(--silver-0)]"
                    : "border-transparent text-[var(--silver-3)] hover:text-[var(--silver-1)]"
                }`}>
                {tabItem.label}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mx-auto max-w-[1840px] px-6 py-16 md:px-9">
        <section className="mb-10">
          <div className="mx-auto flex max-w-3xl items-end justify-center gap-4">
            {podiumRows[1] ? (
              <div className="flex max-w-[220px] flex-1 flex-col items-center gap-3">
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-[var(--plate-sheen)] bg-[var(--steel-3)] font-[var(--font-head)] text-2xl text-[var(--silver-1)]">
                  {podiumRows[1].username.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-center">
                  <p className="font-[var(--font-head)] text-sm uppercase tracking-[0.05em] text-[var(--silver-0)]">
                    @{podiumRows[1].username}
                  </p>
                  <p className="mt-1 text-sm italic text-[var(--silver-3)]">
                    {podiumRows[1].kingdom_name}
                  </p>
                  <p className="mt-3 font-[var(--font-display)] text-3xl text-[var(--plate-sheen)]">
                    {podiumRows[1].prestige.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-full items-center justify-center border border-[var(--plate-hi)] border-b-0 bg-[var(--steel-2)] font-[var(--font-display)] text-3xl text-[var(--plate-hi)]">
                  II
                </div>
              </div>
            ) : null}

            {podiumRows[0] ? (
              <div className="flex max-w-[220px] flex-1 flex-col items-center gap-4">
                <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-[var(--ember)] bg-[linear-gradient(135deg,var(--steel-4),var(--steel-5))] font-[var(--font-head)] text-[30px] text-[var(--silver-0)] shadow-[0_0_36px_rgba(200,88,26,0.3),0_0_60px_rgba(200,88,26,0.1)]">
                  <span className="absolute -top-5 text-lg">⚔</span>
                  {podiumRows[0].username.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-center">
                  <p className="font-[var(--font-head)] text-sm uppercase tracking-[0.05em] text-[var(--silver-0)]">
                    @{podiumRows[0].username}
                  </p>
                  <p className="mt-1 text-sm italic text-[var(--silver-3)]">
                    {podiumRows[0].kingdom_name}
                  </p>
                  <p className="mt-3 font-[var(--font-display)] text-[2.25rem] text-[var(--silver-0)]">
                    {podiumRows[0].prestige.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-[68px] w-full items-center justify-center border border-[var(--ember-lo)] border-b-0 bg-[var(--steel-2)] font-[var(--font-display)] text-4xl text-[var(--ember-lo)]">
                  I
                </div>
              </div>
            ) : null}

            {podiumRows[2] ? (
              <div className="flex max-w-[220px] flex-1 flex-col items-center gap-3">
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-[var(--wood-3)] bg-[var(--steel-3)] font-[var(--font-head)] text-2xl text-[var(--silver-2)]">
                  {podiumRows[2].username.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-center">
                  <p className="font-[var(--font-head)] text-sm uppercase tracking-[0.05em] text-[var(--silver-0)]">
                    @{podiumRows[2].username}
                  </p>
                  <p className="mt-1 text-sm italic text-[var(--silver-3)]">
                    {podiumRows[2].kingdom_name}
                  </p>
                  <p className="mt-3 font-[var(--font-display)] text-3xl text-[var(--wood-3)]">
                    {podiumRows[2].prestige.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-[34px] w-full items-center justify-center border border-[var(--b1)] border-b-0 bg-[var(--steel-2)] font-[var(--font-display)] text-3xl text-[var(--silver-3)]">
                  III
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div>
          <LeaderboardTable
            rows={rows}
            currentUserId={user.id}
            page={currentPage}
            totalPages={Math.max(1, Math.ceil((count ?? 0) / 25))}
            tab={selectedTab}
          />
        </div>

        <div className="mt-10 flex justify-end">
          <Link
            href="/kingdom"
            className="realm-button realm-button-secondary px-4 py-3">
            Return to Kingdom
          </Link>
        </div>
      </div>
    </main>
  );
}
