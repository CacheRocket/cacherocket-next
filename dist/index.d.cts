import { NextConfig } from 'next';

type CacheRocketNextOptions = {
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
declare function resolveSiteToken(explicit?: string): string;
declare function resolveImageBaseUrl(explicit?: string): string;
declare function resolveAssetOrigin(explicit?: string): string;
/**
 * Customer Next.js static CDN base (assetPrefix).
 * Uses CACHEROCKET_STATIC_CDN_URL only — never CacheRocket's internal CACHEROCKET_CDN_URL.
 */
declare function resolveStaticCdnUrl(explicit?: string): string;
declare function buildImageUrl(params: {
    siteToken: string;
    src: string;
    width: number;
    quality?: number;
    imageBaseUrl?: string;
    assetOrigin?: string;
}): string;

/**
 * Wires CacheRocket as the custom next/image loader.
 * Optionally sets `assetPrefix` for `/_next/static` when `staticCdnUrl` /
 * `CACHEROCKET_STATIC_CDN_URL` is set (customer Managed CDN — not HTML/SSR).
 */
declare function withCacheRocket(options?: CacheRocketNextOptions, nextConfig?: NextConfig): NextConfig;

export { type CacheRocketNextOptions, buildImageUrl, resolveAssetOrigin, resolveImageBaseUrl, resolveSiteToken, resolveStaticCdnUrl, withCacheRocket };
