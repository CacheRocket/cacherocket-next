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
};
declare function resolveSiteToken(explicit?: string): string;
declare function resolveImageBaseUrl(explicit?: string): string;
declare function resolveAssetOrigin(explicit?: string): string;
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
 * Does not set assetPrefix — keep hosting (Vercel/etc.) for HTML/SSR.
 */
declare function withCacheRocket(options?: CacheRocketNextOptions, nextConfig?: NextConfig): NextConfig;

export { type CacheRocketNextOptions, buildImageUrl, resolveAssetOrigin, resolveImageBaseUrl, resolveSiteToken, withCacheRocket };
