import Link from "next/link";
import { redirect } from "next/navigation";

import { FindRivalPanel } from "@/src/components/ui/FindRivalPanel";
import { createClient } from "@/utils/supabase/server";

type SearchParams = Promise<{ page?: string }>;

type AttackerKingdom = {
  name: string | null;
  gold: number;
  attack_rating: number;
};

type RaidRow = {
  id: string;
  attacker_id: string;
  defender_id: string;
  attacker_power: number;
  defender_power: number;
  result: "attacker_win" | "defender_win";
  gold_stolen: number;
  attacker_gold_after: number | null;
  defender_gold_after: number | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  kingdoms:
    | {
        name: string;
      }[]
    | null;
};

function getInitials(username: string | null) {
  return (username ?? "??").slice(0, 2).toUpperCase();
}

function getDisplayName(profile: ProfileRow | undefined, fallback: string) {
  return profile?.username ?? fallback;
}

function getKingdomName(profile: ProfileRow | undefined) {
  return profile?.kingdoms?.[0]?.name ?? "Unnamed Kingdom";
}

function getResultCopy(raid: RaidRow, currentUserId: string) {
  const isAttacker = raid.attacker_id === currentUserId;
  const didWin =
    (isAttacker && raid.result === "attacker_win") ||
    (!isAttacker && raid.result === "defender_win");

  return {
    isAttacker,
    didWin,
    title: didWin ? "Victory secured" : "Defense broken",
    label: didWin ? "Victory" : "Defeat",
    accent: didWin
      ? "border-[rgba(79,162,103,0.34)] bg-[rgba(16,50,22,0.3)] text-[#9ee0b4]"
      : "border-[rgba(181,75,75,0.34)] bg-[rgba(61,21,21,0.28)] text-[#ffb8b8]",
  };
}

function getRelativeGold(raid: RaidRow, currentUserId: string) {
  const isAttacker = raid.attacker_id === currentUserId;

  if (raid.gold_stolen <= 0) {
    return {
      label: "No gold changed hands",
      tone: "text-[var(--silver-3)]",
    };
  }

  return {
    label: isAttacker
      ? `+${raid.gold_stolen.toLocaleString()} gold seized`
      : `-${raid.gold_stolen.toLocaleString()} gold lost`,
    tone: isAttacker ? "text-[#9ee0b4]" : "text-[#ffb8b8]",
  };
}

function getPowerDelta(raid: RaidRow, currentUserId: string) {
  const yourPower =
    raid.attacker_id === currentUserId
      ? raid.attacker_power
      : raid.defender_power;
  const enemyPower =
    raid.attacker_id === currentUserId
      ? raid.defender_power
      : raid.attacker_power;
  const delta = yourPower - enemyPower;

  if (delta === 0) {
    return "Evenly matched";
  }

  return `${delta > 0 ? "+" : ""}${delta.toLocaleString()} power spread`;
}

export default async function RaidHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page || "1"));
  const pageSize = 12;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: attackerKingdomRaw } = await supabase
    .from("kingdoms")
    .select("name, gold, attack_rating")
    .eq("user_id", user.id)
    .maybeSingle();
  const attackerKingdom = attackerKingdomRaw as AttackerKingdom | null;

  const { data: raidsData, count } = await supabase
    .from("raids")
    .select(
      "id, attacker_id, defender_id, attacker_power, defender_power, result, gold_stolen, attacker_gold_after, defender_gold_after, created_at",
      { count: "exact" }
    )
    .or(`attacker_id.eq.${user.id},defender_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .range(from, to);

  const raids = (raidsData as RaidRow[] | null) ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const participantIds = Array.from(
    new Set(raids.flatMap((raid) => [raid.attacker_id, raid.defender_id]))
  );

  const { data: profileRows } = participantIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, avatar_url, kingdoms(name)")
        .in("id", participantIds)
    : { data: [] };

  const profiles = new Map(
    ((profileRows as ProfileRow[] | null) ?? []).map((profile) => [
      profile.id,
      profile,
    ]) as [string, ProfileRow][]
  );

  const stats = raids.reduce(
    (acc, raid) => {
      const result = getResultCopy(raid, user.id);
      const isAttacker = raid.attacker_id === user.id;

      if (result.didWin) {
        acc.victories += 1;
      } else {
        acc.defeats += 1;
      }

      acc.goldNet += isAttacker ? raid.gold_stolen : -raid.gold_stolen;
      acc.totalRaids += 1;
      return acc;
    },
    { victories: 0, defeats: 0, goldNet: 0, totalRaids: 0 }
  );
  const previousHref = `/raids/history?page=${Math.max(1, currentPage - 1)}`;
  const nextHref = `/raids/history?page=${Math.min(
    totalPages,
    currentPage + 1
  )}`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#05070b_0%,#0b1018_100%)] text-[var(--silver-1)]">
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

      <section className="border-b border-[var(--b1)] bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,0.12),transparent_55%),linear-gradient(180deg,rgba(16,20,30,0.96),rgba(11,16,24,0.96))] px-6 py-12 md:px-20">
        <div className="mx-auto max-w-[1840px]">
          <p className="realm-label text-[var(--plate-hi)]">War Archive</p>
          <h1 className="realm-page-title mt-4 text-[clamp(2.8rem,6vw,4.8rem)] font-bold leading-[0.92]">
            Chronicle Of <span className="text-[var(--ember)]">Raids</span>
          </h1>
          <p className="realm-lore mt-4 max-w-3xl text-base">
            A complete ledger of every siege, defense, and spoil won or lost in
            your kingdom&apos;s name.
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--b1)] bg-[rgba(3,4,6,0.58)]">
        <div className="mx-auto grid max-w-[1840px] gap-4 px-6 py-6 md:grid-cols-4 md:px-9">
          <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
            <p className="realm-label">Total Raids</p>
            <p className="mt-3 font-[var(--font-display)] text-4xl text-[var(--silver-0)]">
              {stats.totalRaids.toLocaleString()}
            </p>
          </div>
          <div className="border border-[rgba(79,162,103,0.24)] bg-[rgba(16,50,22,0.22)] px-5 py-5">
            <p className="realm-label text-[#8ec8a0]">Victories</p>
            <p className="mt-3 font-[var(--font-display)] text-4xl text-[#b7f0c5]">
              {stats.victories.toLocaleString()}
            </p>
          </div>
          <div className="border border-[rgba(181,75,75,0.24)] bg-[rgba(61,21,21,0.2)] px-5 py-5">
            <p className="realm-label text-[#d6aaaa]">Defeats</p>
            <p className="mt-3 font-[var(--font-display)] text-4xl text-[#ffcccc]">
              {stats.defeats.toLocaleString()}
            </p>
          </div>
          <div className="border border-[rgba(200,88,26,0.24)] bg-[rgba(44,21,13,0.22)] px-5 py-5">
            <p className="realm-label text-[var(--ember-hi)]">Gold Swing</p>
            <p
              className={`mt-3 font-[var(--font-display)] text-4xl ${
                stats.goldNet >= 0 ? "text-[#f3d58d]" : "text-[#ffb8b8]"
              }`}>
              {stats.goldNet >= 0 ? "+" : ""}
              {stats.goldNet.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1840px] px-6 py-12 md:px-9">
        {raids.length > 0 ? (
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
            {/* Raid history column */}
            <div className="space-y-4">
              {raids.map((raid) => {
                const attackerProfile = profiles.get(raid.attacker_id);
                const defenderProfile = profiles.get(raid.defender_id);
                const result = getResultCopy(raid, user.id);
                const gold = getRelativeGold(raid, user.id);

                return (
                  <article key={raid.id} className="realm-panel p-5 md:p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${result.accent}`}>
                            {result.label}
                          </span>
                          <span className="text-[12px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                            {new Date(raid.created_at).toLocaleString()}
                          </span>
                        </div>

                        <h2 className="mt-4 font-[var(--font-head)] text-[1.8rem] leading-none text-[var(--silver-0)]">
                          {result.title}
                        </h2>
                        <p className="mt-3 text-base leading-7 text-[var(--silver-2)]">
                          {raid.attacker_id === user.id
                            ? "You launched a raid on "
                            : "Your realm was raided by "}
                          <span className="text-[var(--silver-0)]">
                            @
                            {raid.attacker_id === user.id
                              ? getDisplayName(
                                  defenderProfile,
                                  "Unknown defender"
                                )
                              : getDisplayName(
                                  attackerProfile,
                                  "Unknown attacker"
                                )}
                          </span>{" "}
                          of{" "}
                          <span className="italic text-[var(--silver-1)]">
                            {raid.attacker_id === user.id
                              ? getKingdomName(defenderProfile)
                              : getKingdomName(attackerProfile)}
                          </span>
                          .
                        </p>
                      </div>

                      <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:min-w-[380px]">
                        <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-4">
                          <p className="realm-label">You</p>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--b1)] bg-[var(--steel-3)] font-[var(--font-head)] text-sm text-[var(--silver-0)]">
                              {getInitials(
                                profiles.get(user.id)?.username ?? "You"
                              )}
                            </div>
                            <div>
                              <p className="font-[var(--font-head)] text-lg text-[var(--silver-0)]">
                                @{getDisplayName(profiles.get(user.id), "you")}
                              </p>
                              <p className="text-sm italic text-[var(--silver-3)]">
                                {raid.attacker_id === user.id
                                  ? getKingdomName(attackerProfile)
                                  : getKingdomName(defenderProfile)}
                              </p>
                            </div>
                          </div>
                          <p className="mt-4 font-[var(--font-display)] text-3xl text-[var(--silver-0)]">
                            {(raid.attacker_id === user.id
                              ? raid.attacker_power
                              : raid.defender_power
                            ).toLocaleString()}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                            Battle power
                          </p>
                        </div>

                        <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-4">
                          <p className="realm-label">Opponent</p>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--b1)] bg-[var(--steel-3)] font-[var(--font-head)] text-sm text-[var(--silver-0)]">
                              {raid.attacker_id === user.id
                                ? getInitials(defenderProfile?.username ?? "EN")
                                : getInitials(
                                    attackerProfile?.username ?? "EN"
                                  )}
                            </div>
                            <div>
                              <p className="font-[var(--font-head)] text-lg text-[var(--silver-0)]">
                                @
                                {raid.attacker_id === user.id
                                  ? getDisplayName(defenderProfile, "enemy")
                                  : getDisplayName(attackerProfile, "enemy")}
                              </p>
                              <p className="text-sm italic text-[var(--silver-3)]">
                                {raid.attacker_id === user.id
                                  ? getKingdomName(defenderProfile)
                                  : getKingdomName(attackerProfile)}
                              </p>
                            </div>
                          </div>
                          <p className="mt-4 font-[var(--font-display)] text-3xl text-[var(--silver-0)]">
                            {(raid.attacker_id === user.id
                              ? raid.defender_power
                              : raid.attacker_power
                            ).toLocaleString()}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                            Battle power
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 border-t border-[var(--b0)] pt-5 sm:grid-cols-3">
                      <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                          Spoils
                        </p>
                        <p
                          className={`mt-2 font-[var(--font-head)] text-lg ${gold.tone}`}>
                          {gold.label}
                        </p>
                      </div>
                      <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                          Power Delta
                        </p>
                        <p className="mt-2 font-[var(--font-head)] text-lg text-[var(--silver-0)]">
                          {getPowerDelta(raid, user.id)}
                        </p>
                      </div>
                      <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                          Treasury Aftermath
                        </p>
                        <p className="mt-2 text-sm text-[var(--silver-2)]">
                          Your vault:{" "}
                          <span className="font-[var(--font-head)] text-[var(--silver-0)]">
                            {(raid.attacker_id === user.id
                              ? raid.attacker_gold_after
                              : raid.defender_gold_after
                            )?.toLocaleString() ?? "Unknown"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Find Rival sidebar — always visible alongside history */}
            <div className="xl:sticky xl:top-6 xl:self-start">
              <FindRivalPanel
                attackerName={attackerKingdom?.name ?? "Your Kingdom"}
                attackerAttackRating={attackerKingdom?.attack_rating ?? 0}
                attackerGold={attackerKingdom?.gold ?? 0}
              />
            </div>
          </div>
        ) : (
          /* ── Empty state — panel contains the Find Rival flow ─────────── */
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
            <div className="realm-panel px-6 py-14 text-center">
              <p className="realm-label text-[var(--plate-hi)]">War Archive</p>
              <h2 className="mt-4 font-[var(--font-head)] text-3xl text-[var(--silver-0)]">
                No raids recorded yet
              </h2>
              <p className="realm-lore mx-auto mt-4 max-w-2xl text-base">
                Your war ledger is still empty. Scout a rival below and launch
                your first raid to begin the chronicle.
              </p>
            </div>
            <FindRivalPanel
              attackerName={attackerKingdom?.name ?? "Your Kingdom"}
              attackerAttackRating={attackerKingdom?.attack_rating ?? 0}
              attackerGold={attackerKingdom?.gold ?? 0}
            />
          </div>
        )}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--b0)] pt-8 md:flex-row">
          <div className="text-sm text-[var(--silver-3)]">
            Page {Math.min(currentPage, totalPages)} of {totalPages}
          </div>
          <div className="flex items-center gap-3">
            {currentPage <= 1 ? (
              <span className="realm-button cursor-not-allowed rounded-[16px] border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-[var(--silver-3)] opacity-50">
                Previous
              </span>
            ) : (
              <Link
                href={previousHref}
                className="realm-button realm-button-secondary rounded-[16px] px-4 py-3">
                Previous
              </Link>
            )}
            <Link
              href="/kingdom"
              className="realm-button realm-button-secondary rounded-[16px] px-4 py-3">
              Return To Kingdom
            </Link>
            {currentPage >= totalPages ? (
              <span className="realm-button cursor-not-allowed rounded-[16px] border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-[var(--silver-3)] opacity-50">
                Next
              </span>
            ) : (
              <Link
                href={nextHref}
                className="realm-button realm-button-secondary rounded-[16px] px-4 py-3">
                Next
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
