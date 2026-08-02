import { buildImageUrl } from './config';

type LoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

/**
 * Custom next/image loader — path-based transforms for reliable CDN caching.
 *
 * Example output:
 * https://img.cacherocket.com/i/site_xxx/w_800,q_75,f_auto/https%3A%2F%2F...
 */
export default function cacheRocketLoader({ src, width, quality }: LoaderProps): string {
  return buildImageUrl({
    siteToken:
      process.env.NEXT_PUBLIC_CACHEROCKET_SITE_TOKEN ||
      process.env.CACHEROCKET_SITE_TOKEN ||
      '',
    src,
    width,
    quality,
    imageBaseUrl:
      process.env.NEXT_PUBLIC_CACHEROCKET_IMG_BASE_URL ||
      process.env.CACHEROCKET_IMG_BASE_URL,
    assetOrigin:
      process.env.NEXT_PUBLIC_CACHEROCKET_ASSET_ORIGIN ||
      process.env.CACHEROCKET_ASSET_ORIGIN ||
      process.env.NEXT_PUBLIC_BASE_URL,
  });
}
