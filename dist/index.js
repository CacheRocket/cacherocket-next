// src/withCacheRocket.ts
import { createRequire } from "module";
import { dirname, isAbsolute, join, relative } from "path";

// src/config.ts
var DEFAULT_IMAGE_BASE = "https://img.cacherocket.com";
function resolveSiteToken(explicit) {
  const token = explicit || process.env.CACHEROCKET_SITE_TOKEN || process.env.NEXT_PUBLIC_CACHEROCKET_SITE_TOKEN || "";
  return token.trim();
}
function resolveImageBaseUrl(explicit) {
  const raw = explicit || process.env.CACHEROCKET_IMG_BASE_URL || process.env.NEXT_PUBLIC_CACHEROCKET_IMG_BASE_URL || DEFAULT_IMAGE_BASE;
  return raw.trim().replace(/\/+$/, "") || DEFAULT_IMAGE_BASE;
}
function resolveAssetOrigin(explicit) {
  const raw = explicit || process.env.CACHEROCKET_ASSET_ORIGIN || process.env.NEXT_PUBLIC_CACHEROCKET_ASSET_ORIGIN || process.env.NEXT_PUBLIC_BASE_URL || "";
  return raw.trim().replace(/\/+$/, "");
}
function resolveStaticCdnUrl(explicit) {
  const raw = explicit || process.env.CACHEROCKET_STATIC_CDN_URL || process.env.NEXT_PUBLIC_CACHEROCKET_STATIC_CDN_URL || "";
  return raw.trim().replace(/\/+$/, "");
}
function buildImageUrl(params) {
  const siteToken = resolveSiteToken(params.siteToken);
  if (!siteToken) {
    throw new Error(
      "@cacherocket/next: missing siteToken. Set CACHEROCKET_SITE_TOKEN or pass siteToken to withCacheRocket()."
    );
  }
  let src = params.src.trim();
  if (src.startsWith("/") && !src.startsWith("//")) {
    const origin = resolveAssetOrigin(params.assetOrigin);
    if (!origin) {
      throw new Error(
        "@cacherocket/next: relative image src requires CACHEROCKET_ASSET_ORIGIN (or NEXT_PUBLIC_BASE_URL) so CacheRocket can fetch the absolute URL."
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

// src/withCacheRocket.ts
function resolveLoaderFile() {
  const cwd = process.cwd();
  const require2 = createRequire(join(cwd, "package.json"));
  let absolute;
  try {
    const pkgJson = require2.resolve("@cacherocket/next/package.json");
    absolute = join(dirname(pkgJson), "dist", "image-loader.js");
  } catch {
    absolute = join(cwd, "node_modules", "@cacherocket", "next", "dist", "image-loader.js");
  }
  const rel = isAbsolute(absolute) ? relative(cwd, absolute) : absolute;
  return rel.split("\\").join("/") || "node_modules/@cacherocket/next/dist/image-loader.js";
}
function withCacheRocket(options = {}, nextConfig = {}) {
  const siteToken = resolveSiteToken(options.siteToken);
  if (!siteToken && process.env.NODE_ENV === "production") {
    console.warn(
      "@cacherocket/next: CACHEROCKET_SITE_TOKEN is not set. Image loader URLs will fail at runtime."
    );
  }
  const staticCdnUrl = resolveStaticCdnUrl(options.staticCdnUrl);
  const env = {
    ...nextConfig.env || {}
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
    ...staticCdnUrl ? { assetPrefix: staticCdnUrl } : {},
    env,
    images: {
      ...nextConfig.images || {},
      loader: "custom",
      loaderFile: resolveLoaderFile()
    }
  };
}
export {
  buildImageUrl,
  resolveAssetOrigin,
  resolveImageBaseUrl,
  resolveSiteToken,
  resolveStaticCdnUrl,
  withCacheRocket
};
//# sourceMappingURL=index.js.map