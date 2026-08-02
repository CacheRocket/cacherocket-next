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

// src/image-loader.ts
var image_loader_exports = {};
__export(image_loader_exports, {
  default: () => cacheRocketLoader
});
module.exports = __toCommonJS(image_loader_exports);

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

// src/image-loader.ts
function cacheRocketLoader({ src, width, quality }) {
  return buildImageUrl({
    siteToken: process.env.NEXT_PUBLIC_CACHEROCKET_SITE_TOKEN || process.env.CACHEROCKET_SITE_TOKEN || "",
    src,
    width,
    quality,
    imageBaseUrl: process.env.NEXT_PUBLIC_CACHEROCKET_IMG_BASE_URL || process.env.CACHEROCKET_IMG_BASE_URL,
    assetOrigin: process.env.NEXT_PUBLIC_CACHEROCKET_ASSET_ORIGIN || process.env.CACHEROCKET_ASSET_ORIGIN || process.env.NEXT_PUBLIC_BASE_URL
  });
}
//# sourceMappingURL=image-loader.cjs.map