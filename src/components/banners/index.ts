import { DragonBannerCard, DragonBannerModal } from "./DragonBanner";
import { DRAGON_BANNER_IMAGES } from "./DragonBanner/DragonBannerImages";

import type { BannerDefinition } from "./types";

/**
 * Resolves an equipped banner item name → a typed key used to look up the
 * correct panel override components (HUD, leaderboard row, podium, scout report).
 *
 * To add a new banner:
 *  1. Create `DragonBanner/panels/` equivalents under `YourBanner/panels/`.
 *  2. Add a new union member to BannerKey below.
 *  3. Add the matching `includes()` check in `getBannerKey`.
 *  4. Register Card + Modal in BANNERS below.
 *
 * The equip API and `equipped_banner_id` DB column are already generic — no
 * server changes needed.
 */
export type BannerKey = "dragon";

export function getBannerKey(
  bannerName: string | null | undefined
): BannerKey | null {
  if (bannerName?.toLowerCase().includes("dragon")) return "dragon";
  return null;
}

export type { BannerDefinition };

/**
 * Banner registry — add new banners here.
 *
 * Each entry needs:
 *   nameMatch  — case-insensitive substring matched against the DB item name
 *   label      — display name for the sidebar collection list
 *   Card       — marketplace grid card component
 *   Modal      — full inspect/claim modal component
 *
 * Example — adding a Phoenix Banner:
 *   import { PhoenixBannerCard, PhoenixBannerModal } from "./PhoenixBanner";
 *   { nameMatch: "phoenix", label: "Phoenix Banner", Card: PhoenixBannerCard, Modal: PhoenixBannerModal },
 */
/**
 * Banner registry — add new banners here.
 *
 * Each entry needs:
 *   nameMatch    — case-insensitive substring matched against the DB item name
 *   label        — display name for the sidebar + section header
 *   season       — badge shown in the section header ("Dragon Season", etc.)
 *   Card         — marketplace / inventory grid card component
 *   Modal        — full inspect / claim modal component
 *   previewImage — path to the showcase image (shown when DB assetKey is empty)
 *
 * ─── Adding a new banner (e.g. Phoenix) ──────────────────────────────────────
 *   1. Create src/components/banners/PhoenixBanner/ with Card, Modal, Images
 *   2. Create panels/ for the 4 UI panel overrides
 *   3. Add the entry below — everything else picks it up automatically
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const BANNERS: BannerDefinition[] = [
  {
    nameMatch: "dragon",
    label: "Dragon Banner",
    season: "Dragon Season",
    Card: DragonBannerCard,
    Modal: DragonBannerModal,
    previewImage: DRAGON_BANNER_IMAGES.cardPreview,
  },

  // ← Add new banners here
];

/**
 * Returns the preview image path for a banner item by name, or null if the
 * banner is not registered or has no previewImage defined.
 * Used by ShopItemCard to show the correct image when assetKey is not set.
 */
export function resolveBannerPreviewImage(itemName: string): string | null {
  const entry = BANNERS.find((b) =>
    itemName.toLowerCase().includes(b.nameMatch.toLowerCase())
  );
  return entry?.previewImage ?? null;
}
