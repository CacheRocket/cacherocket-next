import { uploadStatic, type UploadStaticOptions } from './uploadStatic';

export type ApiKeyAuth = {
  publicKey?: string;
  secretKey?: string;
};

export { uploadStatic, type UploadStaticOptions };

export type WarmOptions = ApiKeyAuth & {
  siteId?: string;
  urls?: string[];
  crawlerId?: string;
  hostname?: string;
  organizationId?: string;
  apiBaseUrl?: string;
};

export type PurgeOptions = ApiKeyAuth & {
  siteId?: string;
  urls?: string[];
  rewarm?: boolean;
  organizationId?: string;
  apiBaseUrl?: string;
};

function resolveApiBase(explicit?: string): string {
  return (
    explicit ||
    process.env.CACHEROCKET_API_BASE_URL ||
    'https://api.cacherocket.com'
  ).replace(/\/+$/, '');
}

function resolveKeys(auth: ApiKeyAuth = {}): { publicKey: string; secretKey: string } {
  const publicKey =
    auth.publicKey ||
    process.env.CACHEROCKET_PUBLIC_KEY ||
    process.env.CACHEROCKET_API_PUBLIC_KEY ||
    '';
  const secretKey =
    auth.secretKey ||
    process.env.CACHEROCKET_SECRET_KEY ||
    process.env.CACHEROCKET_API_SECRET_KEY ||
    process.env.CACHEROCKET_API_KEY ||
    '';
  if (!publicKey || !secretKey) {
    throw new Error(
      '@cacherocket/next: missing API keys. Set CACHEROCKET_PUBLIC_KEY and CACHEROCKET_SECRET_KEY (server-only).'
    );
  }
  return { publicKey, secretKey };
}

function resolveSiteId(explicit?: string): string {
  const id = explicit || process.env.CACHEROCKET_SITE_ID || '';
  if (!id.trim()) {
    throw new Error(
      '@cacherocket/next: missing siteId. Set CACHEROCKET_SITE_ID or pass siteId.'
    );
  }
  return id.trim();
}

async function sitesFetch(
  path: string,
  init: {
    method?: string;
    body?: Record<string, unknown>;
    auth: ApiKeyAuth;
    apiBaseUrl?: string;
    organizationId?: string;
  }
): Promise<unknown> {
  const { publicKey, secretKey } = resolveKeys(init.auth);
  const base = resolveApiBase(init.apiBaseUrl);
  const body = {
    ...(init.body || {}),
    publicKey,
    secretKey,
    ...(init.organizationId ? { organizationId: init.organizationId } : {}),
  };

  const res = await fetch(`${base}/web/v1/sites${path}`, {
    method: init.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Public-Key': publicKey,
      'X-Secret-Key': secretKey,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: unknown;
  };
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `CacheRocket API error (${res.status})`);
  }
  return json.data;
}

/** Warm URLs for a site, or trigger warmers by hostname when urls omitted. */
export async function warm(options: WarmOptions = {}): Promise<unknown> {
  const siteId = resolveSiteId(options.siteId);
  return sitesFetch(`/${siteId}/warm`, {
    method: 'POST',
    auth: options,
    apiBaseUrl: options.apiBaseUrl,
    organizationId: options.organizationId,
    body: {
      urls: options.urls,
      crawlerId: options.crawlerId,
      hostname: options.hostname,
    },
  });
}

/** Purge Managed CDN assets for a site (optional rewarm). */
export async function purge(options: PurgeOptions = {}): Promise<unknown> {
  const siteId = resolveSiteId(options.siteId);
  return sitesFetch(`/${siteId}/purge`, {
    method: 'POST',
    auth: options,
    apiBaseUrl: options.apiBaseUrl,
    organizationId: options.organizationId,
    body: {
      urls: options.urls,
      rewarm: options.rewarm,
    },
  });
}

export type OnVercelDeployOptions = ApiKeyAuth & {
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
export function onVercelDeploy(options: OnVercelDeployOptions = {}) {
  return async function POST(req: Request): Promise<Response> {
    try {
      const incoming = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const { publicKey, secretKey } = resolveKeys(options);
      const base = resolveApiBase(options.apiBaseUrl);

      if (options.siteId || process.env.CACHEROCKET_SITE_ID) {
        const siteId = resolveSiteId(options.siteId);
        const urls: string[] = [];
        if (typeof incoming.url === 'string') urls.push(incoming.url);
        if (typeof incoming.deploymentUrl === 'string') urls.push(incoming.deploymentUrl);
        if (Array.isArray(incoming.urls)) {
          for (const u of incoming.urls) {
            if (typeof u === 'string') urls.push(u);
          }
        }

        const data = await sitesFetch(`/${siteId}/warm`, {
          method: 'POST',
          auth: { publicKey, secretKey },
          apiBaseUrl: options.apiBaseUrl,
          organizationId: options.organizationId,
          body: { urls: urls.length ? urls : undefined },
        });
        return Response.json({ success: true, data });
      }

      const res = await fetch(`${base}/web/v1/public/webhooks/vercel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Public-Key': publicKey,
          'X-Secret-Key': secretKey,
        },
        body: JSON.stringify({
          ...incoming,
          publicKey,
          secretKey,
        }),
      });
      const json = await res.json().catch(() => ({}));
      return Response.json(json, { status: res.status });
    } catch (error) {
      return Response.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Deploy warm failed',
        },
        { status: 500 }
      );
    }
  };
}
