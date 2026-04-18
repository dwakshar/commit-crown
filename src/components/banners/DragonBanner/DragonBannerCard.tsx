"use client";

import Image from "next/image";

import { DRAGON_BANNER_IMAGES } from "@/src/components/banners/DragonBanner/DragonBannerImages";
import type { BannerCardProps } from "../types";

export function DragonBannerCard({ item, onInspect }: BannerCardProps) {
  return (
    <article
      className="group relative cursor-pointer overflow-hidden border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(9,13,20,.94),rgba(7,10,16,.98))] transition hover:border-[rgba(212,168,48,.45)]"
      onClick={onInspect}>

      {/* Owned badge */}
      {item?.owned && (
        <div className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center border border-[rgba(212,168,48,.5)] bg-[rgba(24,18,4,.95)] text-[#d4a830]">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
            <path d="M7.7 13.6 4.5 10.4l-1.4 1.4 4.6 4.6L17 7.1l-1.4-1.4z" />
          </svg>
        </div>
      )}

      {/* Preview area — custom showcase image */}
      <div className="relative h-[220px] overflow-hidden border-b border-[var(--b1)]">
        <Image
          src={DRAGON_BANNER_IMAGES.cardPreview}
          alt="Dragon Banner"
          fill
          unoptimized
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Inspect hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "rgba(2,3,5,.55)", backdropFilter: "blur(1px)" }}
        >
          <span className="border border-[rgba(212,168,48,.6)] bg-[rgba(20,12,2,.9)] px-5 py-2.5 font-[var(--font-head)] text-xs uppercase tracking-[0.28em] text-[#d4a830]">
            Inspect
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="border-b border-[rgba(80,105,130,.08)] bg-[rgba(16,22,34,.46)] px-4 py-4">
        <p className="realm-label text-[10px] text-[#cc3010]">War Banner</p>
        <h2 className="mt-1.5 font-[var(--font-head)] text-xl text-[var(--silver-0)]">Dragon Banner</h2>
        <p className="realm-lore mt-1.5 text-sm">Forged in the Ashen Peaks. Those who march beneath its scales are feared without question.</p>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="font-[var(--font-head)] text-xl text-[#6fd38c]">Free</p>
          <p className="mt-0.5 text-[11px] text-[var(--silver-3)]">Claim once</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="border border-[rgba(212,168,48,.4)] bg-[rgba(212,168,48,.06)] px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-[#d4a830]">Exclusive</span>
          <span className="border border-[var(--b1)] bg-[rgba(255,255,255,.03)] px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-[var(--silver-3)]">Banner</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[rgba(80,105,130,.08)] px-4 py-4">
        {item?.owned ? (
          <span className="border border-[rgba(212,168,48,.4)] bg-[rgba(40,30,8,.6)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a830]">Owned</span>
        ) : (
          <span className="border border-[rgba(79,162,103,.4)] bg-[rgba(10,40,16,.6)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7fdb91]">Free</span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onInspect(); }}
          className="realm-button border border-[rgba(212,168,48,.4)] bg-[rgba(30,20,4,.7)] px-4 py-2.5 text-[11px] text-[#d4a830] transition hover:border-[rgba(212,168,48,.8)] hover:bg-[rgba(40,28,6,.9)]">
          Inspect Skin
        </button>
      </div>
    </article>
  );
}
