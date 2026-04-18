"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { GitHubStatsData } from "@/src/types/game";

type EditProfileClientProps = {
  username: string;
  avatarUrl: string | null;
  kingdomName: string;
  prestige: number;
  gold: number;
  raidsEnabled: boolean;
  githubStats: GitHubStatsData | null;
};

function StatBlock({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.015)] px-4 py-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
        {label}
      </div>
      <div className="mt-2 font-[var(--font-head)] text-2xl leading-none text-[var(--silver-0)]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

export function EditProfileClient({
  username,
  avatarUrl,
  kingdomName,
  prestige,
  gold,
  raidsEnabled,
  githubStats,
}: EditProfileClientProps) {
  const router = useRouter();
  const [kingdomNameVal, setKingdomNameVal] = useState(kingdomName);
  const [raidsEnabledVal, setRaidsEnabledVal] = useState(raidsEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isDirty =
    kingdomNameVal.trim() !== kingdomName ||
    raidsEnabledVal !== raidsEnabled;

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kingdom_name: kingdomNameVal.trim(),
          raids_enabled: raidsEnabledVal,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to save changes");
        return;
      }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  const topLanguage = githubStats?.languages
    ? Object.entries(githubStats.languages).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—"
    : "—";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#05070b_0%,#0b1018_100%)] text-[var(--silver-1)]">
      {/* Top nav */}
      <div className="border-b border-[var(--b1)] bg-[linear-gradient(180deg,rgba(3,4,6,0.98),rgba(8,11,16,0.94))]">
        <div className="flex h-[42px] items-center justify-between px-4 text-[11px] uppercase tracking-[0.28em] text-[var(--silver-3)]">
          <div className="flex items-center gap-2">
            <span className="realm-orb h-2 w-2" />
            <span className="realm-orb h-2 w-2 opacity-70" />
            <span className="realm-orb h-2 w-2 opacity-45" />
          </div>
          <div className="hidden items-center gap-12 md:flex">
            <Link href="/kingdom" className="transition hover:text-[var(--silver-0)]">
              Game
            </Link>
            <Link href="/marketplace" className="transition hover:text-[var(--silver-0)]">
              Marketplace
            </Link>
            <Link href="/leaderboard" className="transition hover:text-[var(--silver-0)]">
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

      {/* Hero header */}
      <section className="border-b border-[var(--b1)] bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,0.1),transparent_55%),linear-gradient(180deg,rgba(16,20,30,0.98),rgba(11,16,24,0.98))] px-6 py-10 md:px-14">
        <div className="mx-auto max-w-5xl">
          <p className="realm-label text-[var(--plate-hi)]">Realm Identity</p>
          <div className="mt-6 flex items-center gap-6">
            {/* Avatar — circle is intentional */}
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={username}
                width={88}
                height={88}
                className="h-[88px] w-[88px] shrink-0 rounded-full border-2 border-[var(--b2)] object-cover"
              />
            ) : (
              <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--b2)] bg-[var(--steel-3)] font-[var(--font-head)] text-4xl text-[var(--silver-0)]">
                {username[0]?.toUpperCase() ?? "?"}
              </div>
            )}

            <div>
              <h1 className="font-[var(--font-head)] text-[2.4rem] leading-none tracking-[0.03em] text-[var(--silver-0)]">
                {username}
              </h1>
              <p className="mt-2 text-sm italic text-[var(--silver-2)]">
                {kingdomNameVal}
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.26em] text-[var(--plate-hi)]">
                Prestige #{prestige.toLocaleString()} &nbsp;·&nbsp; {gold.toLocaleString()} Gold
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left — GitHub stats */}
          <div className="space-y-6">
            {/* GitHub identity */}
            <div className="border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(14,18,28,0.96),rgba(7,10,16,0.98))]">
              <div className="border-b border-[var(--b0)] px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                  GitHub Archive
                </div>
                <div className="mt-1 font-[var(--font-head)] text-lg text-[var(--silver-0)]">
                  Developer Record
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-[var(--silver-3)]">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="font-mono text-sm text-[var(--silver-1)]">
                    @{username}
                  </span>
                  <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                    Linked
                  </span>
                </div>

                <p className="mt-3 text-[11px] italic text-[var(--silver-3)]">
                  GitHub identity is linked at sign-in and cannot be changed here.
                </p>
              </div>
            </div>

            {/* GitHub stats */}
            {githubStats ? (
              <div className="border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(14,18,28,0.96),rgba(7,10,16,0.98))]">
                <div className="border-b border-[var(--b0)] px-5 py-4">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                    Combat Intel
                  </div>
                  <div className="mt-1 font-[var(--font-head)] text-lg text-[var(--silver-0)]">
                    GitHub Statistics
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-[var(--b0)] p-px sm:grid-cols-3">
                  <StatBlock label="Total Commits" value={githubStats.total_commits} />
                  <StatBlock label="Repositories" value={githubStats.total_repos} />
                  <StatBlock label="Stars Earned" value={githubStats.total_stars} />
                  <StatBlock label="Pull Requests" value={githubStats.total_prs} />
                  <StatBlock label="Followers" value={githubStats.followers} />
                  <StatBlock label="Top Language" value={topLanguage} />
                  <StatBlock label="Current Streak" value={`${githubStats.current_streak}d`} />
                  <StatBlock label="Longest Streak" value={`${githubStats.longest_streak}d`} />
                </div>
                {githubStats.synced_at && (
                  <div
                    suppressHydrationWarning
                    className="border-t border-[var(--b0)] px-5 py-3 text-[10px] text-[var(--silver-3)]">
                    Last synced:{" "}
                    {new Date(githubStats.synced_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(14,18,28,0.96),rgba(7,10,16,0.98))] px-5 py-8 text-center text-sm italic text-[var(--silver-3)]">
                No GitHub stats yet — sync from the Kingdom screen.
              </div>
            )}
          </div>

          {/* Right — editable settings */}
          <div className="space-y-4">
            {/* Kingdom name */}
            <div className="border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(14,18,28,0.96),rgba(7,10,16,0.98))]">
              <div className="border-b border-[var(--b0)] px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                  Kingdom Settings
                </div>
                <div className="mt-1 font-[var(--font-head)] text-lg text-[var(--silver-0)]">
                  Realm Identity
                </div>
              </div>
              <div className="px-5 py-5 space-y-5">
                <div>
                  <label
                    htmlFor="kingdom-name"
                    className="block text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                    Kingdom Name
                  </label>
                  <input
                    id="kingdom-name"
                    type="text"
                    value={kingdomNameVal}
                    onChange={(e) => setKingdomNameVal(e.target.value)}
                    maxLength={60}
                    className="mt-2 w-full border border-[var(--b1)] bg-[rgba(255,255,255,0.03)] px-4 py-3 font-[var(--font-head)] text-base text-[var(--silver-0)] placeholder-[var(--silver-3)] outline-none transition focus:border-[var(--b2)] focus:bg-[rgba(255,255,255,0.05)]"
                    placeholder="Name your kingdom..."
                  />
                  <p className="mt-1.5 text-[10px] text-[var(--silver-3)]">
                    {kingdomNameVal.length}/60 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Raids toggle */}
            <div className="border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(14,18,28,0.96),rgba(7,10,16,0.98))]">
              <div className="border-b border-[var(--b0)] px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                  Combat Settings
                </div>
                <div className="mt-1 font-[var(--font-head)] text-lg text-[var(--silver-0)]">
                  Raid Participation
                </div>
              </div>
              <div className="px-5 py-5">
                <button
                  type="button"
                  onClick={() => setRaidsEnabledVal((v) => !v)}
                  className="flex w-full items-center justify-between gap-4 border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-4 transition hover:border-[var(--b1)] hover:bg-[rgba(255,255,255,0.04)]">
                  <div className="text-left">
                    <div className="text-sm font-semibold text-[var(--silver-0)]">
                      {raidsEnabledVal ? "Raids Enabled" : "Raids Disabled"}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--silver-3)]">
                      {raidsEnabledVal
                        ? "Your kingdom can be attacked by rivals"
                        : "Your kingdom is shielded from attacks"}
                    </div>
                  </div>
                  {/* Toggle pill */}
                  <div
                    className={`relative h-6 w-11 shrink-0 border transition-colors ${
                      raidsEnabledVal
                        ? "border-[var(--ember)] bg-[rgba(200,88,26,0.22)]"
                        : "border-[var(--b1)] bg-[rgba(255,255,255,0.04)]"
                    }`}>
                    <span
                      className={`absolute top-0.5 h-4 w-4 border transition-all ${
                        raidsEnabledVal
                          ? "left-[calc(100%-18px)] border-[var(--ember-hi)] bg-[var(--ember-hi)]"
                          : "left-0.5 border-[var(--silver-3)] bg-[var(--silver-3)]"
                      }`}
                    />
                  </div>
                </button>
                <p className="mt-3 text-[11px] italic text-[var(--silver-3)]">
                  Disabling raids removes you from the rival pool but you can
                  still initiate attacks.
                </p>
              </div>
            </div>

            {/* Save */}
            <div className="space-y-3">
              {error && (
                <div className="border border-[rgba(200,50,50,0.35)] bg-[rgba(80,15,15,0.5)] px-4 py-3 text-sm text-[#ff9090]">
                  {error}
                </div>
              )}
              {saved && (
                <div className="border border-[rgba(50,180,80,0.35)] bg-[rgba(10,60,20,0.5)] px-4 py-3 text-sm text-[#80e090]">
                  Changes saved successfully.
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="realm-button realm-button-primary w-full py-3.5 disabled:opacity-40">
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <Link
                href="/kingdom"
                className="realm-button realm-button-secondary block w-full border border-[var(--b1)] py-3 text-center text-sm">
                Return to Kingdom
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
