"use client";

import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ProfileButtonProps = {
  username: string;
  avatarUrl?: string | null;
  kingdomName: string;
  prestige: number;
};

export function ProfileButton({
  username,
  avatarUrl,
  kingdomName,
  prestige,
}: ProfileButtonProps) {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false); // ✅ added
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (confirmLogout) return; // ✅ prevent closing during confirm

      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (confirmLogout) {
        setConfirmLogout(false); // ✅ close confirm first
        return;
      }
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, confirmLogout]);

  const handleLogout = async () => {
    setOpen(false);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative flex h-11 min-w-11 items-center justify-center overflow-hidden border px-3 transition ${
          open
            ? "border-[rgba(200,88,26,0.56)] bg-[linear-gradient(180deg,rgba(40,18,11,0.94),rgba(23,10,7,0.94))] text-[var(--silver-0)] shadow-[0_10px_28px_rgba(200,88,26,0.2)]"
            : "border-[var(--b1)] bg-[linear-gradient(180deg,rgba(18,24,34,0.96),rgba(9,13,20,0.94))] text-[var(--silver-1)] hover:border-[var(--b2)] hover:text-[var(--silver-0)]"
        }`}
        aria-label="Open profile"
        aria-expanded={open}>
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(176,196,214,0.36),transparent)]" />

        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={username}
            width={28}
            height={28}
            className="h-7 w-7 rounded-full border border-[var(--b1)] object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--b1)] bg-[var(--steel-3)] font-[var(--font-head)] text-sm text-[var(--silver-0)]">
            {username[0]?.toUpperCase() || "?"}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+12px)] z-[70] w-[min(360px,calc(100vw-1.5rem))] overflow-hidden border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(11,15,23,0.98),rgba(5,8,13,0.98))] text-[var(--silver-1)] shadow-[0_28px_80px_rgba(0,0,0,0.56),0_0_0_1px_rgba(200,88,26,0.08)] max-md:fixed max-md:left-3 max-md:right-3 max-md:top-[92px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,88,26,0.16),transparent_28%),linear-gradient(135deg,rgba(176,196,214,0.05),transparent_24%)]" />

          <div className="relative border-b border-[var(--b0)] px-5 py-6">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center border border-[var(--b0)] text-[var(--silver-2)] hover:text-[var(--silver-0)] transition"
              aria-label="Close profile">
              ×
            </button>

            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={username}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-2xl border border-[var(--b1)] object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--b1)] bg-[var(--steel-3)] text-4xl text-[var(--silver-0)]">
                  {username[0]?.toUpperCase() || "?"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-[var(--font-head)] text-2xl leading-none text-[var(--silver-0)]">
                  {username}
                </p>
                <p className="mt-1 text-sm text-[var(--silver-2)]">
                  {kingdomName}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--plate-hi)]">
                  PRESTIGE #{prestige.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <button className="realm-button realm-button-secondary w-full py-3 text-sm">
              Edit Profile
            </button>

            <button
              onClick={() => setConfirmLogout(true)} // ✅ changed
              className="realm-button w-full border border-red-900/60 bg-[rgba(80,20,20,0.4)] py-3 text-sm text-red-400 hover:border-red-700 hover:text-red-300 transition">
              Logout from Realm
            </button>
          </div>

          {/* ✅ NEW CONFIRM PANEL */}
          {confirmLogout && (
            <div className="absolute inset-0 z-[90] flex items-center justify-center bg-[rgba(4,6,10,0.9)] backdrop-blur-[3px]">
              <div className="w-[92%] max-w-[320px] border border-[rgba(200,88,26,0.6)] bg-[linear-gradient(180deg,rgba(18,8,6,0.98),rgba(8,4,3,0.98))] px-5 py-5 text-center shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
                <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                  Realm Alert
                </div>

                <div className="mt-3 font-[var(--font-head)] text-[1.4rem] text-[var(--ember-hi)]">
                  Leave the Realm?
                </div>

                <div className="mt-3 text-sm text-[var(--silver-2)]">
                  Your session will end. Unsynced progress may be lost.
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="flex-1 border border-[var(--b1)] py-2 text-xs uppercase tracking-[0.16em] text-[var(--silver-2)] hover:text-[var(--silver-0)]">
                    Stay
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex-1 border border-red-800 bg-[rgba(90,20,20,0.55)] py-2 text-xs uppercase tracking-[0.16em] text-red-400 hover:text-red-300">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
