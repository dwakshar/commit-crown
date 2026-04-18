"use client";

import Image from "next/image";

/**
 * Dragon Banner — centralised image registry.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  Place your images in  public/banners/dragon/           │
 * │                                                         │
 * │  showcase.png      → DragonBannerModal hero image       │
 * │  preview-image.png → Inventory & marketplace card       │
 * │  crown-realm.png   → HUD Crown Realm panel background   │
 * │  leaderboard.png   → Leaderboard row background         │
 * │  podium.png        → Podium bar background              │
 * │  scout-report.png  → Scout Report panel background      │
 * └─────────────────────────────────────────────────────────┘
 *
 * To swap an image just change the path here — nothing else needs updating.
 */
export const DRAGON_BANNER_IMAGES = {
  /** DragonBannerModal hero (prominent centred image inside the card) */
  showcase: "/banners/dragon/showcase.png",

  /** DragonBannerCard + ShopItemCard (inventory & marketplace grid) preview */
  cardPreview: "/banners/dragon/preview-image.png",

  /** HUD top-left Crown Realm cell background */
  crownRealm: "/banners/dragon/crown-realm.png",

  /** Leaderboard table row background */
  leaderboard: "/banners/dragon/leaderboard.png",

  /** Leaderboard podium bar background */
  podium: "/banners/dragon/podium.png",

  /** Scout Report aside panel background */
  scoutReport: "/banners/dragon/scout-report.png",
} as const;

export type DragonBannerImageKey = keyof typeof DRAGON_BANNER_IMAGES;

// ---------------------------------------------------------------------------
// Showcase image — used by DragonBannerModal as the main banner artwork
// ---------------------------------------------------------------------------

/**
 * The showcase image displayed inside the DragonBannerModal card.
 * Rendered at the fixed banner-card dimensions (210 × 245).
 */
/**
 * Renders the showcase image filling the full banner card (210 × 315).
 * Must be the FIRST child of the `relative overflow-hidden` card div so that
 * all fire/scale/glow effects render on top of it.
 */
export function DragonBannerShowcaseImage() {
  return (
    <Image
      src={DRAGON_BANNER_IMAGES.showcase}
      alt="Dragon Banner"
      fill
      unoptimized
      priority
      className="object-cover object-center"
    />
  );
}

// ---------------------------------------------------------------------------
// Panel background helpers
// ---------------------------------------------------------------------------

/**
 * Returns inline CSS properties that apply the given dragon-banner image as a
 * CSS background layer underneath an existing gradient.
 *
 * Usage — spread into a style prop alongside your gradient:
 *
 *   <div style={{ ...dragonPanelBg("crownRealm"), border: "..." }}>
 *
 * The gradient is painted on top so that the dark dragon atmosphere is
 * preserved while the custom image shows through underneath.
 *
 * @param key    Which panel image to use from DRAGON_BANNER_IMAGES
 * @param overlay  The gradient string layered on top of the image (defaults to
 *                 a semi-transparent dark-red gradient that matches the theme)
 */
export function dragonPanelBg(
  key: DragonBannerImageKey,
  overlay = "linear-gradient(135deg,rgba(18,3,3,.76) 0%,rgba(10,2,2,.72) 55%,rgba(14,4,2,.76) 100%)"
): React.CSSProperties {
  return {
    backgroundImage: `${overlay}, url(${DRAGON_BANNER_IMAGES[key]})`,
    backgroundSize: "auto, cover",
    backgroundPosition: "auto, center",
    backgroundRepeat: "no-repeat, no-repeat",
  };
}

/**
 * Variant of dragonPanelBg for horizontally-banded panels (leaderboard row).
 * Uses a left-to-right fire gradient that blends naturally with the image.
 */
export function dragonRowBg(): React.CSSProperties {
  return {
    backgroundImage: `linear-gradient(90deg,rgba(70,5,5,.8) 0%,rgba(40,10,4,.65) 50%,rgba(8,2,2,.45) 100%), url(${DRAGON_BANNER_IMAGES.leaderboard})`,
    backgroundSize: "auto, cover",
    backgroundPosition: "auto, center",
    backgroundRepeat: "no-repeat, no-repeat",
  };
}

/**
 * Variant for the Scout Report aside (scrollable panel).
 * Positions the image at the top and uses attachment: local so it scrolls
 * naturally with the panel content.
 */
export function dragonScoutReportBg(): React.CSSProperties {
  return {
    backgroundImage: `linear-gradient(180deg,rgba(14,3,3,.82) 0%,rgba(8,2,2,.78) 55%,rgba(12,4,2,.82) 100%), url(${DRAGON_BANNER_IMAGES.scoutReport})`,
    backgroundSize: "auto, cover",
    backgroundPosition: "auto, top center",
    backgroundRepeat: "no-repeat, no-repeat",
    backgroundAttachment: "local, local",
  };
}
