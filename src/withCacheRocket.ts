import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative } from 'node:path';
import type { NextConfig } from 'next';
import type { CacheRocketNextOptions } from './config';
import { resolveSiteToken, resolveStaticCdnUrl } from './config';

/**
 * Next.js joins `images.loaderFile` with the project root. Absolute paths get
 * doubled (…/httpdocs/…/httpdocs/node_modules/…), so always return a path
 * relative to `process.cwd()`. Prefer the ESM build Next loads for loaders.
 */
function resolveLoaderFile(): string {
  const cwd = process.cwd();
  const require = createRequire(join(cwd, 'package.json'));
  let absolute: string;
  try {
    const pkgJson = require.resolve('@cacherocket/next/package.json');
    absolute = join(dirname(pkgJson), 'dist', 'image-loader.js');
  } catch {
    absolute = join(cwd, 'node_modules', '@cacherocket', 'next', 'dist', 'image-loader.js');
  }
  const rel = isAbsolute(absolute) ? relative(cwd, absolute) : absolute;
  // Next expects a project-relative path (posix-style separators are fine).
  return rel.split('\\').join('/') || 'node_modules/@cacherocket/next/dist/image-loader.js';
}

/**
 * Wires CacheRocket as the custom next/image loader.
 * Optionally sets `assetPrefix` for `/_next/static` when `staticCdnUrl` /
 * `CACHEROCKET_STATIC_CDN_URL` is set (customer Managed CDN — not HTML/SSR).
 */
export function withCacheRocket(
  options: CacheRocketNextOptions = {},
  nextConfig: NextConfig = {}
): NextConfig {
  const siteToken = resolveSiteToken(options.siteToken);
  if (!siteToken && process.env.NODE_ENV === 'production') {
    console.warn(
      '@cacherocket/next: CACHEROCKET_SITE_TOKEN is not set. Image loader URLs will fail at runtime.'
    );
  }

  const staticCdnUrl = resolveStaticCdnUrl(options.staticCdnUrl);

  const env: Record<string, string> = {
    ...((nextConfig.env as Record<string, string> | undefined) || {}),
  };
  if (siteToken) {
    env.CACHEROCKET_SITE_TOKEN = siteToken;
    env.NEXT_PUBLIC_CACHEROCKET_SITE_TOKEN = siteToken;
  }
  if (options.imageBaseUrl) {
    env.CACHEROCKET_IMG_BASE_URL = options.imageBaseUrl;
    env.NEXT_PUBLIC_CACHEROCKET_IMG_BASE_URL = options.imageBaseUrl;
  }
  if (options.assetOrigin) {
    env.CACHEROCKET_ASSET_ORIGIN = options.assetOrigin;
    env.NEXT_PUBLIC_CACHEROCKET_ASSET_ORIGIN = options.assetOrigin;
  }
  if (staticCdnUrl) {
    env.CACHEROCKET_STATIC_CDN_URL = staticCdnUrl;
    env.NEXT_PUBLIC_CACHEROCKET_STATIC_CDN_URL = staticCdnUrl;
  }

  return {
    ...nextConfig,
    ...(staticCdnUrl ? { assetPrefix: staticCdnUrl } : {}),
    env,
    images: {
      ...(nextConfig.images || {}),
      loader: 'custom',
      loaderFile: resolveLoaderFile(),
    },
  };
}
