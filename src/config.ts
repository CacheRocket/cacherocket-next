export type CacheRocketNextOptions = {
  /** Public site token from the CacheRocket dashboard (embedded in image URLs). */
  siteToken?: string;
  /** Image edge base URL. Defaults to https://img.cacherocket.com */
  imageBaseUrl?: string;
  /**
   * Absolute origin used to resolve relative `/public` image paths for next/image.
   * Example: https://www.example.com
   */
  assetOrigin?: string;
  /**
   * Optional CDN base for Next.js `/_next/static` (customer sites only).
   * From Account → Next.js → Static asset CDN (`staticCdnUrl`).
   * Sets `assetPrefix` — do not confuse with CacheRocket.com's own `CACHEROCKET_CDN_URL`.
   */
  staticCdnUrl?: string;
};

const DEFAULT_IMAGE_BASE = 'https://img.cacherocket.com';

export function resolveSiteToken(explicit?: string): string {
  const token =
    explicit ||
    process.env.CACHEROCKET_SITE_TOKEN ||
    process.env.NEXT_PUBLIC_CACHEROCKET_SITE_TOKEN ||
    '';
  return token.trim();
}

export function resolveImageBaseUrl(explicit?: string): string {
  const raw =
    explicit ||
    process.env.CACHEROCKET_IMG_BASE_URL ||
    process.env.NEXT_PUBLIC_CACHEROCKET_IMG_BASE_URL ||
    DEFAULT_IMAGE_BASE;
  return raw.trim().replace(/\/+$/, '') || DEFAULT_IMAGE_BASE;
}

export function resolveAssetOrigin(explicit?: string): string {
  const raw =
    explicit ||
    process.env.CACHEROCKET_ASSET_ORIGIN ||
    process.env.NEXT_PUBLIC_CACHEROCKET_ASSET_ORIGIN ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    '';
  return raw.trim().replace(/\/+$/, '');
}

/**
 * Customer Next.js static CDN base (assetPrefix).
 * Uses CACHEROCKET_STATIC_CDN_URL only — never CacheRocket's internal CACHEROCKET_CDN_URL.
 */
export function resolveStaticCdnUrl(explicit?: string): string {
  const raw =
    explicit ||
    process.env.CACHEROCKET_STATIC_CDN_URL ||
    process.env.NEXT_PUBLIC_CACHEROCKET_STATIC_CDN_URL ||
    '';
  return raw.trim().replace(/\/+$/, '');
}

export function buildImageUrl(params: {
  siteToken: string;
  src: string;
  width: number;
  quality?: number;
  imageBaseUrl?: string;
  assetOrigin?: string;
}): string {
  const siteToken = resolveSiteToken(params.siteToken);
  if (!siteToken) {
    throw new Error(
      '@cacherocket/next: missing siteToken. Set CACHEROCKET_SITE_TOKEN or pass siteToken to withCacheRocket().'
    );
  }

  let src = params.src.trim();
  if (src.startsWith('/') && !src.startsWith('//')) {
    const origin = resolveAssetOrigin(params.assetOrigin);
    if (!origin) {
      throw new Error(
        '@cacherocket/next: relative image src requires CACHEROCKET_ASSET_ORIGIN (or NEXT_PUBLIC_BASE_URL) so CacheRocket can fetch the absolute URL.'
      );
    }
    src = `${origin}${src}`;
  }

  if (!/^https?:\/\//i.test(src)) {
    throw new Error(
      `@cacherocket/next: image src must be an absolute http(s) URL (got "${params.src}")`
    );
  }

  const width = Math.max(1, Math.min(4096, Math.round(params.width || 800)));
  const quality = Math.max(1, Math.min(100, Math.round(params.quality ?? 75)));
  const base = resolveImageBaseUrl(params.imageBaseUrl);
  return `${base}/i/${encodeURIComponent(siteToken)}/w_${width},q_${quality},f_auto/${encodeURIComponent(src)}`;
}
