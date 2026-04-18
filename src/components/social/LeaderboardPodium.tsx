"use client";

import {
  DragonPodiumAvatar,
  DragonPodiumBar,
} from "@/src/components/banners/DragonBanner/panels/DragonPodiumSlot";

type PodiumRow = {
  user_id: string;
  username: string;
  kingdom_name: string;
  prestige: number;
  banner_name?: string | null;
};

function hasDragonBanner(row: PodiumRow) {
  return Boolean(row.banner_name?.toLowerCase().includes("dragon"));
}

export function LeaderboardPodium({ podiumRows }: { podiumRows: PodiumRow[] }) {
  const [rank2, rank1, rank3] = [podiumRows[1], podiumRows[0], podiumRows[2]];

  return (
    <div className="mx-auto flex max-w-3xl items-end justify-center gap-4">
      {/* Rank 2 */}
      {rank2 ? (
        <div className="flex max-w-[220px] flex-1 flex-col items-center gap-3">
          {hasDragonBanner(rank2) ? (
            <DragonPodiumAvatar username={rank2.username} rank={2} />
          ) : (
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-[var(--plate-sheen)] bg-[var(--steel-3)] font-[var(--font-head)] text-2xl text-[var(--silver-1)]">
              {rank2.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-center">
            <p className="font-[var(--font-head)] text-sm uppercase tracking-[0.05em] text-[var(--silver-0)]">@{rank2.username}</p>
            <p className="mt-1 text-sm italic text-[var(--silver-3)]">{rank2.kingdom_name}</p>
            <p className="mt-3 font-[var(--font-display)] text-3xl text-[var(--plate-sheen)]">{rank2.prestige.toLocaleString()}</p>
          </div>
          {hasDragonBanner(rank2) ? (
            <DragonPodiumBar rank={2} label="II" />
          ) : (
            <div className="flex h-12 w-full items-center justify-center border border-[var(--plate-hi)] border-b-0 bg-[var(--steel-2)] font-[var(--font-display)] text-3xl text-[var(--plate-hi)]">II</div>
          )}
        </div>
      ) : null}

      {/* Rank 1 */}
      {rank1 ? (
        <div className="flex max-w-[220px] flex-1 flex-col items-center gap-4">
          {hasDragonBanner(rank1) ? (
            <DragonPodiumAvatar username={rank1.username} rank={1} />
          ) : (
            <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-[var(--ember)] bg-[linear-gradient(135deg,var(--steel-4),var(--steel-5))] font-[var(--font-head)] text-[30px] text-[var(--silver-0)] shadow-[0_0_36px_rgba(200,88,26,0.3),0_0_60px_rgba(200,88,26,0.1)]">
              <span className="absolute -top-5 text-lg">⚔</span>
              {rank1.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-center">
            <p className="font-[var(--font-head)] text-sm uppercase tracking-[0.05em] text-[var(--silver-0)]">@{rank1.username}</p>
            <p className="mt-1 text-sm italic text-[var(--silver-3)]">{rank1.kingdom_name}</p>
            <p className="mt-3 font-[var(--font-display)] text-[2.25rem] text-[var(--silver-0)]">{rank1.prestige.toLocaleString()}</p>
          </div>
          {hasDragonBanner(rank1) ? (
            <DragonPodiumBar rank={1} label="I" />
          ) : (
            <div className="flex h-[68px] w-full items-center justify-center border border-[var(--ember-lo)] border-b-0 bg-[var(--steel-2)] font-[var(--font-display)] text-4xl text-[var(--ember-lo)]">I</div>
          )}
        </div>
      ) : null}

      {/* Rank 3 */}
      {rank3 ? (
        <div className="flex max-w-[220px] flex-1 flex-col items-center gap-3">
          {hasDragonBanner(rank3) ? (
            <DragonPodiumAvatar username={rank3.username} rank={3} />
          ) : (
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-[var(--wood-3)] bg-[var(--steel-3)] font-[var(--font-head)] text-2xl text-[var(--silver-2)]">
              {rank3.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-center">
            <p className="font-[var(--font-head)] text-sm uppercase tracking-[0.05em] text-[var(--silver-0)]">@{rank3.username}</p>
            <p className="mt-1 text-sm italic text-[var(--silver-3)]">{rank3.kingdom_name}</p>
            <p className="mt-3 font-[var(--font-display)] text-3xl text-[var(--wood-3)]">{rank3.prestige.toLocaleString()}</p>
          </div>
          {hasDragonBanner(rank3) ? (
            <DragonPodiumBar rank={3} label="III" />
          ) : (
            <div className="flex h-[34px] w-full items-center justify-center border border-[var(--b1)] border-b-0 bg-[var(--steel-2)] font-[var(--font-display)] text-3xl text-[var(--silver-3)]">III</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
