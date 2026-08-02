type ApiKeyAuth$1 = {
    publicKey?: string;
    secretKey?: string;
};
type UploadStaticOptions = ApiKeyAuth$1 & {
    siteId?: string;
    /** Local directory to upload (default: `.next/static`). */
    dir?: string;
    apiBaseUrl?: string;
    organizationId?: string;
    /**
     * Wipe the remote static prefix before the first batch (default true).
     * Subsequent batches in the same run keep `replace: false`.
     */
    replace?: boolean;
    /** Max files per API request (default 30). */
    batchSize?: number;
};
/**
 * Upload `.next/static` (or a custom dir) to CacheRocket Managed CDN for the site.
 * Requires static CDN enabled on the site in Account → Next.js.
 */
declare function uploadStatic(options?: UploadStaticOptions): Promise<{
    uploaded: number;
    batches: number;
    staticCdnUrl?: string | null;
}>;

type ApiKeyAuth = {
    publicKey?: string;
    secretKey?: string;
};

type WarmOptions = ApiKeyAuth & {
    siteId?: string;
    urls?: string[];
    crawlerId?: string;
    hostname?: string;
    organizationId?: string;
    apiBaseUrl?: string;
};
type PurgeOptions = ApiKeyAuth & {
    siteId?: string;
    urls?: string[];
    rewarm?: boolean;
    organizationId?: string;
    apiBaseUrl?: string;
};
/** Warm URLs for a site, or trigger warmers by hostname when urls omitted. */
declare function warm(options?: WarmOptions): Promise<unknown>;
/** Purge Managed CDN assets for a site (optional rewarm). */
declare function purge(options?: PurgeOptions): Promise<unknown>;
type OnVercelDeployOptions = ApiKeyAuth & {
    /** Prefer site warm endpoint when set; otherwise uses public Vercel webhook. */
    siteId?: string;
    apiBaseUrl?: string;
    organizationId?: string;
};
/**
 * Next.js App Router handler: forwards Vercel deploy webhooks to CacheRocket warmers.
 *
 * app/api/cacherocket/deploy/route.ts
 *   export const POST = onVercelDeploy()
 */
declare function onVercelDeploy(options?: OnVercelDeployOptions): (req: Request) => Promise<Response>;

export { type ApiKeyAuth, type OnVercelDeployOptions, type PurgeOptions, type UploadStaticOptions, type WarmOptions, onVercelDeploy, purge, uploadStatic, warm };
