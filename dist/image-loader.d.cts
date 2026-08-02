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
declare function cacheRocketLoader({ src, width, quality }: LoaderProps): string;

export { cacheRocketLoader as default };
