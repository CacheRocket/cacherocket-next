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

export { type ApiKeyAuth, type OnVercelDeployOptions, type PurgeOptions, type WarmOptions, onVercelDeploy, purge, warm };
