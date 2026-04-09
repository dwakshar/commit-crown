"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LeaderboardRow = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  kingdom_name: string;
  prestige: number;
  top_language: string;
  raid_wins: number;
};

export function LeaderboardTable({
  rows,
  currentUserId,
  page,
  totalPages,
  tab,
}: {
  rows: LeaderboardRow[];
  currentUserId: string | null;
  page: number;
  totalPages: number;
  tab: string;
}) {
  const router = useRouter();

  const getLanguageClass = (language: string) => {
    const normalized = language.toLowerCase();

    if (normalized.includes("javascript"))
      return "border-[rgba(247,223,30,0.35)] text-[rgba(247,223,30,0.8)]";
    if (normalized.includes("python"))
      return "border-[rgba(55,118,171,0.40)] text-[rgba(100,165,225,0.9)]";
    if (normalized.includes("rust"))
      return "border-[rgba(200,88,26,0.40)] text-[rgba(200,130,90,0.9)]";
    if (normalized.includes("typescript"))
      return "border-[rgba(49,120,198,0.40)] text-[rgba(110,165,225,0.9)]";
    if (normalized.includes("go"))
      return "border-[rgba(110,150,210,0.35)] text-[rgba(160,190,245,0.82)]";

    return "border-[var(--b1)] text-[var(--silver-3)]";
  };

  return (
    <div className="overflow-hidden border border-[var(--b0)] bg-[rgba(7,10,16,0.62)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-[var(--silver-1)]">
          <thead>
            <tr className="bg-[rgba(3,4,6,0.45)] text-xs uppercase tracking-[0.2em] text-[var(--silver-3)]">
              <th className="border-b border-[var(--b1)] px-4 py-4">Rank</th>
              <th className="border-b border-[var(--b1)] px-4 py-4">
                Commander
              </th>
              <th className="border-b border-[var(--b1)] px-4 py-4">Kingdom</th>
              <th className="border-b border-[var(--b1)] px-4 py-4">
                Language
              </th>
              <th className="border-b border-[var(--b1)] px-4 py-4">
                Prestige
              </th>
              <th className="border-b border-[var(--b1)] px-4 py-4">Raids</th>
              <th className="border-b border-[var(--b1)] px-4 py-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rank = (page - 1) * 25 + index + 1;
              const isCurrentUser = row.user_id === currentUserId;

              return (
                <tr
                  key={`${row.user_id}-${row.top_language}-${rank}`}
                  onClick={() => router.push(`/visit/${row.username}`)}
                  className={`cursor-pointer transition ${
                    isCurrentUser
                      ? "bg-[var(--ember-mist)]"
                      : "hover:bg-[var(--steel-glow)]"
                  }`}>
                  <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4 font-[var(--font-head)] text-base text-[var(--silver-0)]">
                    {rank}
                  </td>
                  <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4">
                    <div className="flex items-center gap-3">
                      {row.avatar_url ? (
                        <Image
                          src={row.avatar_url}
                          alt={row.username}
                          width={38}
                          height={38}
                          className="h-[38px] w-[38px] rounded-full border border-[var(--b1)] object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-[38px] w-[38px] items-center justify-center rounded-full border ${
                            isCurrentUser
                              ? "border-[var(--ember-lo)] text-[var(--ember)]"
                              : "border-[var(--b1)] text-[var(--silver-2)]"
                          } bg-[var(--steel-3)] font-[var(--font-head)] text-[13px]`}>
                          {row.username.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p
                          className={`font-[var(--font-head)] text-sm ${
                            isCurrentUser
                              ? "text-[var(--ember)]"
                              : "text-[var(--silver-0)]"
                          }`}>
                          @{row.username}
                        </p>
                        <p className="text-[13px] italic text-[var(--silver-3)]">
                          {row.kingdom_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4 text-[15px] italic text-[var(--silver-2)]">
                    {row.kingdom_name}
                  </td>
                  <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4">
                    <span
                      className={`inline-block border px-3 py-1 font-[var(--font-head)] text-[10px] uppercase tracking-[0.14em] ${getLanguageClass(
                        row.top_language
                      )}`}>
                      {row.top_language.slice(0, 2).toUpperCase()}
                    </span>
                  </td>
                  <td
                    className={`border-b border-[rgba(80,105,130,0.06)] px-4 py-4 font-[var(--font-head)] text-xl font-semibold ${
                      isCurrentUser
                        ? "text-[var(--ember)]"
                        : "text-[var(--silver-0)]"
                    }`}>
                    {row.prestige.toLocaleString()}
                  </td>
                  <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4 font-[var(--font-head)] text-sm text-[var(--silver-3)]">
                    {row.raid_wins}
                  </td>
                  <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4">
                    <Link
                      href={
                        isCurrentUser ? "/kingdom" : `/visit/${row.username}`
                      }
                      className={`realm-button inline-flex rounded-[2px] border px-6 py-2 text-[11px] ${
                        isCurrentUser
                          ? "border-[var(--ember)] bg-[rgba(44,21,13,0.72)] text-[var(--ember)]"
                          : "border-[var(--b1)] bg-transparent text-[var(--silver-3)] hover:text-[var(--silver-1)]"
                      }`}
                      onClick={(event) => event.stopPropagation()}>
                      {isCurrentUser ? "Your Keep" : "Visit"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-auto flex items-center justify-between text-sm text-[var(--silver-2)]">
        <span className="px-4 py-4">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-3 px-4 py-4">
          <a
            href={`?tab=${tab}&page=${Math.max(1, page - 1)}`}
            className={`realm-button realm-button-secondary rounded-[2px] px-4 py-2 ${
              page <= 1 ? "pointer-events-none opacity-40" : ""
            }`}>
            Previous
          </a>
          <a
            href={`?tab=${tab}&page=${Math.min(totalPages, page + 1)}`}
            className={`realm-button realm-button-secondary rounded-[2px] px-4 py-2 ${
              page >= totalPages ? "pointer-events-none opacity-40" : ""
            }`}>
            Next
          </a>
        </div>
      </div>
    </div>
  );
}
