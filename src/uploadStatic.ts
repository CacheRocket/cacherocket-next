import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

type ApiKeyAuth = {
  publicKey?: string;
  secretKey?: string;
};

export type UploadStaticOptions = ApiKeyAuth & {
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

type UploadFile = {
  path: string;
  contentBase64: string;
  contentType: string;
};

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.map': 'application/json',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.htm': 'text/html',
};

function contentTypeFor(filePath: string): string {
  const lower = filePath.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot < 0) return 'application/octet-stream';
  return CONTENT_TYPES[lower.slice(dot)] || 'application/octet-stream';
}

async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  await walk(root);
  return out;
}

async function sitesUpload(
  siteId: string,
  body: Record<string, unknown>,
  auth: { publicKey: string; secretKey: string },
  apiBaseUrl?: string,
  organizationId?: string
): Promise<unknown> {
  const base = (
    apiBaseUrl ||
    process.env.CACHEROCKET_API_BASE_URL ||
    'https://api.cacherocket.com'
  ).replace(/\/+$/, '');

  const res = await fetch(`${base}/web/v1/sites/${encodeURIComponent(siteId)}/static/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Public-Key': auth.publicKey,
      'X-Secret-Key': auth.secretKey,
    },
    body: JSON.stringify({
      ...body,
      publicKey: auth.publicKey,
      secretKey: auth.secretKey,
      ...(organizationId ? { organizationId } : {}),
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: unknown;
  };
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `CacheRocket static upload failed (${res.status})`);
  }
  return json.data;
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

/**
 * Upload `.next/static` (or a custom dir) to CacheRocket Managed CDN for the site.
 * Requires static CDN enabled on the site in Account → Next.js.
 */
export async function uploadStatic(options: UploadStaticOptions = {}): Promise<{
  uploaded: number;
  batches: number;
  staticCdnUrl?: string | null;
}> {
  const siteId = resolveSiteId(options.siteId);
  const auth = resolveKeys(options);
  const dir = options.dir || join(process.cwd(), '.next', 'static');
  const batchSize = Math.max(1, Math.min(40, options.batchSize ?? 30));
  const replace = options.replace !== false;

  const st = await stat(dir).catch(() => null);
  if (!st?.isDirectory()) {
    throw new Error(
      `@cacherocket/next: static directory not found: ${dir}. Run next build first.`
    );
  }

  const absoluteFiles = await walkFiles(dir);
  if (!absoluteFiles.length) {
    throw new Error(`@cacherocket/next: no files found under ${dir}`);
  }

  const files: UploadFile[] = [];
  for (const abs of absoluteFiles) {
    const rel = relative(dir, abs).split('\\').join('/');
    const body = await readFile(abs);
    files.push({
      path: `_next/static/${rel}`,
      contentBase64: body.toString('base64'),
      contentType: contentTypeFor(rel),
    });
  }

  let uploaded = 0;
  let batches = 0;
  let staticCdnUrl: string | null | undefined;

  for (let i = 0; i < files.length; i += batchSize) {
    const chunk = files.slice(i, i + batchSize);
    const data = (await sitesUpload(
      siteId,
      {
        files: chunk,
        replace: replace && i === 0,
      },
      auth,
      options.apiBaseUrl,
      options.organizationId
    )) as { uploaded?: number; staticCdnUrl?: string | null };

    uploaded += data.uploaded ?? chunk.length;
    batches += 1;
    if (data.staticCdnUrl) staticCdnUrl = data.staticCdnUrl;
  }

  return { uploaded, batches, staticCdnUrl };
}
