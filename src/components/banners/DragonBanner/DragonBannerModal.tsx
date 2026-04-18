"use client";

import { useEffect, useState } from "react";

import { useNotificationStore } from "@/src/store/notificationStore";
import { DragonBannerShowcaseImage } from "@/src/components/banners/DragonBanner/DragonBannerImages";

import type { BannerModalProps } from "../types";

const EMBERS = [
  {
    left: "10%",
    bottom: "8%",
    delay: "0s",
    dur: "2.8s",
    drift: "-18px",
    size: 4,
  },
  {
    left: "22%",
    bottom: "6%",
    delay: "0.7s",
    dur: "3.3s",
    drift: "14px",
    size: 3,
  },
  {
    left: "38%",
    bottom: "11%",
    delay: "1.3s",
    dur: "2.6s",
    drift: "-10px",
    size: 5,
  },
  {
    left: "52%",
    bottom: "5%",
    delay: "0.4s",
    dur: "3.6s",
    drift: "20px",
    size: 3,
  },
  {
    left: "65%",
    bottom: "9%",
    delay: "1.9s",
    dur: "2.9s",
    drift: "-22px",
    size: 4,
  },
  {
    left: "76%",
    bottom: "7%",
    delay: "0.9s",
    dur: "3.1s",
    drift: "11px",
    size: 3,
  },
  {
    left: "86%",
    bottom: "6%",
    delay: "2.2s",
    dur: "2.7s",
    drift: "-15px",
    size: 4,
  },
  {
    left: "30%",
    bottom: "4%",
    delay: "1.6s",
    dur: "3.4s",
    drift: "17px",
    size: 3,
  },
];

export function DragonBannerModal({ item, onClose }: BannerModalProps) {
  const [owned, setOwned] = useState(item?.owned ?? false);
  const [equipped, setEquipped] = useState(item?.equipped ?? false);
  const [claiming, setClaiming] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleClaim = async () => {
    if (!item || claiming || owned) return;
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/free-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to claim");
      setOwned(true);
      addNotification({
        id: `dragon-banner-${Date.now()}`,
        user_id: "local",
        type: "purchase_complete",
        message: "Dragon Banner claimed. Glory to your realm.",
        data: null,
        read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setClaiming(false);
    }
  };

  const handleEquip = async () => {
    if (!item || equipping || equipped) return;
    setEquipping(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/equip-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = (await res.json()) as { error?: string; equipped?: boolean };
      if (!res.ok) throw new Error(data.error ?? "Failed to equip");
      setEquipped(data.equipped ?? true);
      addNotification({
        id: `dragon-banner-equip-${Date.now()}`,
        user_id: "local",
        type: "purchase_complete",
        message: "Dragon Banner equipped. Your kingdom now flies under the Dragon.",
        data: null,
        read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setEquipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
      <style>{`
        @keyframes db-bannerFloat{0%,100%{transform:translateY(0) rotate(-.6deg)}50%{transform:translateY(-14px) rotate(.6deg)}}
        @keyframes db-fireFront{0%,100%{clip-path:polygon(0% 100%,8% 55%,18% 78%,26% 22%,36% 62%,46% 4%,55% 48%,65% 18%,74% 58%,84% 28%,92% 68%,100% 100%);opacity:.95}50%{clip-path:polygon(0% 100%,10% 48%,20% 72%,28% 18%,38% 58%,48% 0%,57% 42%,67% 14%,76% 52%,86% 22%,94% 62%,100% 100%);opacity:1}}
        @keyframes db-fireBack{0%,100%{clip-path:polygon(0% 100%,5% 60%,14% 82%,22% 32%,32% 68%,42% 12%,52% 54%,62% 24%,70% 64%,80% 36%,90% 72%,100% 100%)}50%{clip-path:polygon(0% 100%,7% 52%,16% 76%,24% 26%,34% 64%,44% 8%,54% 50%,64% 18%,72% 58%,82% 30%,92% 66%,100% 100%)}}
        @keyframes db-coreGlow{0%,100%{opacity:.7}50%{opacity:1}}
        @keyframes db-sweep{0%{transform:translateX(-200%) skewX(-16deg);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(320%) skewX(-16deg);opacity:0}}
        @keyframes db-ambientPulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.55;transform:scale(1.08)}}
        @keyframes db-ringPulse{0%{transform:translate(-50%,-50%) scale(.9);opacity:.55}50%{transform:translate(-50%,-50%) scale(1.1);opacity:0}100%{transform:translate(-50%,-50%) scale(.9);opacity:.55}}
        @keyframes db-emberRise{0%{transform:translateY(0) translateX(0);opacity:.95}100%{transform:translateY(-110px) translateX(var(--drift));opacity:0}}
        @keyframes db-eyePulse{0%,100%{opacity:.85}50%{opacity:1;filter:drop-shadow(0 0 8px #ff2200)}}
        @keyframes db-tierFlicker{0%,100%{letter-spacing:.3em;opacity:.9}50%{letter-spacing:.35em;opacity:1}}
        @keyframes db-slideInLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes db-slideInRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes db-borderGlow{0%,100%{box-shadow:0 0 0 1px rgba(212,168,48,.25),0 0 50px rgba(160,15,15,.45),inset 0 0 60px rgba(80,4,4,.6)}50%{box-shadow:0 0 0 1px rgba(212,168,48,.5),0 0 80px rgba(200,25,10,.6),inset 0 0 80px rgba(100,6,6,.7)}}
        @keyframes db-scalesScroll{from{background-position:0 0}to{background-position:0 40px}}
        @keyframes db-modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-[1100px] overflow-hidden border border-[var(--b1)] bg-[#020305]"
        style={{
          animation: "db-modalIn .35s cubic-bezier(.16,1,.3,1) forwards",
        }}>
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center border border-[var(--b1)] text-[var(--silver-3)] transition hover:border-[var(--b2)] hover:text-[var(--silver-0)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Ambient bg */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 35% 58%, rgba(130,8,8,.2) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 65% 42%, rgba(170,70,8,.08) 0%, transparent 55%)",
            animation: "db-ambientPulse 5s ease-in-out infinite",
          }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[.05] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,.04)_2px,rgba(255,255,255,.04)_3px)]" />

        <div className="relative flex flex-col items-center gap-12 px-8 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-14 lg:py-14">
          {/* ── LEFT: Banner visual ── */}
          <div
            className="relative flex shrink-0 flex-col items-center"
            style={{
              animation: "db-slideInLeft .55s cubic-bezier(.16,1,.3,1) both",
            }}>
            {/* Pulse rings */}
            {[140, 195, 260].map((sz, i) => (
              <div
                key={sz}
                className="pointer-events-none absolute left-1/2 top-1/2"
                style={{
                  width: sz,
                  height: sz,
                  border: "1px solid rgba(180,20,10,.22)",
                  animation: `db-ringPulse ${3 + i * 0.8}s ease-in-out ${
                    i * 0.6
                  }s infinite`,
                }}
              />
            ))}

            {/* Floor glow */}
            <div
              className="pointer-events-none absolute bottom-[2%] left-1/2 -translate-x-1/2"
              style={{
                width: 260,
                height: 55,
                background:
                  "radial-gradient(ellipse at center, rgba(200,40,10,.5) 0%, transparent 70%)",
                animation: "db-coreGlow 2.5s ease-in-out infinite",
              }}
            />

            {/* Embers */}
            {EMBERS.map((e, i) => (
              <div
                key={i}
                className="pointer-events-none absolute"
                style={{
                  left: e.left,
                  bottom: e.bottom,
                  width: e.size,
                  height: e.size,
                  background:
                    i % 3 === 0
                      ? "#ff6030"
                      : i % 3 === 1
                      ? "#ffaa30"
                      : "#ff3010",
                  boxShadow: `0 0 ${e.size * 2}px ${
                    i % 2 === 0 ? "#ff3000" : "#ff8800"
                  }`,
                  ["--drift" as string]: e.drift,
                  animation: `db-emberRise ${e.dur} ${e.delay} ease-out infinite`,
                }}
              />
            ))}

            {/* Floating banner */}
            <div
              style={{
                animation: "db-bannerFloat 5.5s ease-in-out infinite",
                filter:
                  "drop-shadow(0 28px 48px rgba(0,0,0,.9)) drop-shadow(0 0 38px rgba(170,15,10,.5))",
              }}>
              <div
                style={{
                  padding: 2,
                  background:
                    "linear-gradient(180deg, #d4a830 0%, #7a4808 45%, #c8902a 75%, #d4a830 100%)",
                  animation: "db-borderGlow 3.5s ease-in-out infinite",
                }}>
                <div
                  className="relative overflow-hidden"
                  style={{ width: 210, height: 315, background: "#080103" }}>

                  {/* ← Dragon image: first child = bottom layer, everything else renders on top */}
                  <DragonBannerShowcaseImage />


                  <div
                    className="absolute inset-x-0 top-0 h-[2px]"
                    style={{
                      background:
                        "linear-gradient(90deg,transparent,#d4a830,#fff8d0,#d4a830,transparent)",
                    }}
                  />

                  {/* Sweep */}
                  <div
                    className="pointer-events-none absolute inset-0 z-10"
                    style={{
                      background:
                        "linear-gradient(110deg,transparent 38%,rgba(255,255,255,.13) 50%,transparent 62%)",
                      width: "55%",
                      animation: "db-sweep 5s ease-in-out 1.5s infinite",
                    }}
                  />

                  {/* Corner ornaments */}
                  {[
                    { top: "8px", left: "8px" },
                    { top: "8px", right: "8px" },
                    { bottom: "8px", left: "8px" },
                    { bottom: "8px", right: "8px" },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        ...pos,
                        width: 14,
                        height: 14,
                        border: "1.5px solid rgba(212,168,48,.7)",
                      }}
                    />
                  ))}

                  {/* Fire */}
                  <div
                    className="absolute inset-x-0 bottom-0"
                    style={{ height: 88 }}>
                    <div
                      className="absolute inset-x-0 bottom-0"
                      style={{
                        height: 70,
                        background:
                          "linear-gradient(0deg,rgba(180,30,0,.95) 0%,rgba(240,110,0,.75) 40%,rgba(255,200,0,.3) 70%,transparent 100%)",
                        animation: "db-fireBack .9s ease-in-out infinite",
                      }}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0"
                      style={{
                        height: 54,
                        background:
                          "linear-gradient(0deg,rgba(255,70,0,.98) 0%,rgba(255,155,0,.85) 38%,rgba(255,230,60,.4) 68%,transparent 100%)",
                        animation: "db-fireFront .7s ease-in-out .15s infinite",
                      }}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0"
                      style={{
                        height: 26,
                        background:
                          "linear-gradient(0deg,rgba(255,230,180,1) 0%,rgba(255,140,0,.7) 45%,transparent 100%)",
                        animation: "db-coreGlow .5s ease-in-out infinite",
                      }}
                    />
                  </div>

                  <div
                    className="absolute inset-x-0 bottom-0 h-[2px]"
                    style={{
                      background:
                        "linear-gradient(90deg,transparent,#d4a830,#fff8d0,#d4a830,transparent)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Info ── */}
          <div
            className="flex-1"
            style={{
              animation:
                "db-slideInRight .55s cubic-bezier(.16,1,.3,1) .1s both",
            }}>
            {/* Tier badges */}
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { l: "EXCLUSIVE", g: true },
                { l: "ANIMATED", g: false },
                { l: "FREE CLAIM", g: false },
              ].map(({ l, g }) => (
                <span
                  key={l}
                  className="border px-2 py-1 font-[var(--font-head)] text-[9px] tracking-[0.22em]"
                  style={{
                    borderColor: g
                      ? "rgba(212,168,48,.55)"
                      : "rgba(180,20,20,.45)",
                    color: g ? "#d4a830" : "#cc4020",
                    background: g
                      ? "rgba(212,168,48,.07)"
                      : "rgba(180,20,20,.07)",
                  }}>
                  {l}
                </span>
              ))}
            </div>

            {/* Name */}
            <h2
              className="font-[var(--font-head)] leading-[.88] text-[var(--silver-0)]"
              style={{ fontSize: "clamp(2.6rem,5vw,4.2rem)" }}>
              DRAGON
              <br />
              <span style={{ color: "#d4a830" }}>BANNER</span>
            </h2>
            <p className="mt-3 font-[var(--font-head)] text-[11px] uppercase tracking-[0.24em] text-[#cc3010]">
              War Banner · Kingdom Cosmetic · Season I
            </p>

            <div
              className="my-5 h-px"
              style={{
                background:
                  "linear-gradient(90deg,rgba(180,20,20,.5),rgba(212,168,48,.3),transparent)",
              }}
            />

            <p className="realm-lore text-[15px] leading-[1.85] text-[var(--silver-2)]">
              Forged in the Ashen Peaks by those who dared to tame fire itself.
              Kingdoms that fly the Dragon Banner are feared without question —
              their enemies remember the screams before they remember the
              flames.
            </p>

            {/* Attributes */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3">
              {[
                { label: "Rarity", value: "Exclusive" },
                { label: "Type", value: "War Banner" },
                { label: "Collection", value: "Dragon" },
                { label: "Finish", value: "Animated" },
                { label: "Edition", value: "Season I" },
                { label: "Slot", value: "Kingdom" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="px-4 py-3"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(245, 37, 0, 0.8)",
                  }}>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--silver-3)]">
                    {label}
                  </div>
                  <div className="mt-1 font-[var(--font-head)] text-sm text-[var(--silver-0)]">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Rarity bar */}
            <div className="mt-4 flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="h-[6px] flex-1"
                  style={{
                    background:
                      i < 9
                        ? "linear-gradient(90deg,#cc2010,#e84020)"
                        : "rgba(255,255,255,.06)",
                    boxShadow: i < 9 ? "0 0 6px rgba(200,30,10,.4)" : "none",
                  }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[9px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
              <span>Factory New</span>
              <span>Dragon Tier</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-center gap-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--silver-3)]">
                  Price
                </div>
                <div className="mt-1 font-[var(--font-head)] text-[2.6rem] leading-none text-[#6fd38c]">
                  FREE
                </div>
              </div>
              <div className="h-12 w-px bg-[var(--b1)]" />
              <p className="text-[11px] italic leading-5 text-[var(--silver-3)]">
                Claim once.
                <br />
                Yours forever.
              </p>
            </div>

            {error && (
              <div className="mt-4 border border-[rgba(200,50,50,.4)] bg-[rgba(80,10,10,.5)] px-4 py-3 text-sm text-[#ff9090]">
                {error}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3">
              {!owned ? (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={claiming || !item}
                  className="realm-button w-full py-4 font-[var(--font-head)] text-sm uppercase tracking-[0.24em] text-[var(--silver-0)] transition disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg,#6b0808 0%,#aa1a10 30%,#cc2818 55%,#aa1a10 75%,#6b0808 100%)",
                    boxShadow:
                      "0 0 36px rgba(180,20,10,.45),0 0 0 1px rgba(200,50,20,.35),inset 0 1px 0 rgba(255,255,255,.08)",
                  }}>
                  {claiming ? "Claiming…" : item ? "⚔ Claim Dragon Banner — Free" : "Coming Soon"}
                </button>
              ) : equipped ? (
                <div
                  className="flex items-center gap-4 border px-5 py-4"
                  style={{
                    borderColor: "rgba(212,168,48,.55)",
                    background: "linear-gradient(135deg,rgba(50,38,8,.75),rgba(30,22,4,.85))",
                    boxShadow: "0 0 30px rgba(212,168,48,.18)",
                  }}>
                  <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" style={{ fill: "#d4a830" }}>
                    <path d="M7.7 13.6 4.5 10.4l-1.4 1.4 4.6 4.6L17 7.1l-1.4-1.4z" />
                  </svg>
                  <div>
                    <div className="font-[var(--font-head)] text-sm uppercase tracking-[0.24em] text-[#d4a830]">
                      Banner Equipped
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--silver-3)]">
                      Flying over your kingdom. Glory to the Dragon.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="flex items-center gap-3 border px-4 py-3"
                    style={{ borderColor: "rgba(212,168,48,.3)", background: "rgba(40,30,5,.5)" }}>
                    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" style={{ fill: "#d4a830" }}>
                      <path d="M7.7 13.6 4.5 10.4l-1.4 1.4 4.6 4.6L17 7.1l-1.4-1.4z" />
                    </svg>
                    <div className="text-[11px] text-[var(--silver-3)]">
                      Claimed — now equip it to fly the Dragon Banner over your realm.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleEquip}
                    disabled={equipping}
                    className="realm-button w-full py-4 font-[var(--font-head)] text-sm uppercase tracking-[0.24em] text-[var(--silver-0)] transition disabled:opacity-50"
                    style={{
                      background:
                        "linear-gradient(135deg,#3a1f00 0%,#7a4808 30%,#c8902a 55%,#7a4808 75%,#3a1f00 100%)",
                      boxShadow:
                        "0 0 36px rgba(212,140,20,.35),0 0 0 1px rgba(212,168,48,.4),inset 0 1px 0 rgba(255,255,255,.08)",
                    }}>
                    {equipping ? "Equipping…" : "🐉 Equip Dragon Banner"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
