"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  buildImageUrl: () => buildImageUrl,
  resolveAssetOrigin: () => resolveAssetOrigin,
  resolveImageBaseUrl: () => resolveImageBaseUrl,
  resolveSiteToken: () => resolveSiteToken,
  resolveStaticCdnUrl: () => resolveStaticCdnUrl,
  withCacheRocket: () => withCacheRocket
});
module.exports = __toCommonJS(src_exports);

// src/withCacheRocket.ts
var import_node_module = require("module");
var import_node_path = require("path");

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
  const require2 = (0, import_node_module.createRequire)((0, import_node_path.join)(cwd, "package.json"));
  let absolute;
  try {
    const pkgJson = require2.resolve("@cacherocket/next/package.json");
    absolute = (0, import_node_path.join)((0, import_node_path.dirname)(pkgJson), "dist", "image-loader.js");
  } catch {
    absolute = (0, import_node_path.join)(cwd, "node_modules", "@cacherocket", "next", "dist", "image-loader.js");
  }
  const rel = (0, import_node_path.isAbsolute)(absolute) ? (0, import_node_path.relative)(cwd, absolute) : absolute;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildImageUrl,
  resolveAssetOrigin,
  resolveImageBaseUrl,
  resolveSiteToken,
  resolveStaticCdnUrl,
  withCacheRocket
});
//# sourceMappingURL=index.cjs.map