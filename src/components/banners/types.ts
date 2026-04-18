import type { MarketplaceItem } from "@/src/lib/shop";

export interface BannerCardProps {
  item: MarketplaceItem | null;
  onInspect: () => void;
}

export interface BannerModalProps {
  item: MarketplaceItem | null;
  onClose: () => void;
}

export interface BannerDefinition {
  /** Matched against the DB item name (case-insensitive contains check) */
  nameMatch: string;
  /** Display name shown in the sidebar and section header */
  label: string;
  /**
   * Season badge text shown in the banner section header.
   * e.g. "Dragon Season", "Phoenix Season"
   * Leave undefined to show no badge.
   */
  season?: string;
  Card: React.ComponentType<BannerCardProps>;
  Modal: React.ComponentType<BannerModalProps>;
  /**
   * Absolute public path to the preview image shown in ShopItemCard when the
   * DB item has no assetKey set (e.g. /banners/dragon/showcase.png).
   */
  previewImage?: string;
}
