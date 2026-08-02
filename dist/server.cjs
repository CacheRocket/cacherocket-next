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

// src/server.ts
var server_exports = {};
__export(server_exports, {
  onVercelDeploy: () => onVercelDeploy,
  purge: () => purge,
  uploadStatic: () => uploadStatic,
  warm: () => warm
});
module.exports = __toCommonJS(server_exports);

// src/uploadStatic.ts
var import_promises = require("fs/promises");
var import_node_path = require("path");
var CONTENT_TYPES = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".map": "application/json",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".html": "text/html",
  ".htm": "text/html"
};
function contentTypeFor(filePath) {
  const lower = filePath.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return "application/octet-stream";
  return CONTENT_TYPES[lower.slice(dot)] || "application/octet-stream";
}
async function walkFiles(root) {
  const out = [];
  async function walk(dir) {
    const entries = await (0, import_promises.readdir)(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = (0, import_node_path.join)(dir, entry.name);
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
async function sitesUpload(siteId, body, auth, apiBaseUrl, organizationId) {
  const base = (apiBaseUrl || process.env.CACHEROCKET_API_BASE_URL || "https://api.cacherocket.com").replace(/\/+$/, "");
  const res = await fetch(`${base}/web/v1/sites/${encodeURIComponent(siteId)}/static/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Public-Key": auth.publicKey,
      "X-Secret-Key": auth.secretKey
    },
    body: JSON.stringify({
      ...body,
      publicKey: auth.publicKey,
      secretKey: auth.secretKey,
      ...organizationId ? { organizationId } : {}
    })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `CacheRocket static upload failed (${res.status})`);
  }
  return json.data;
}
function resolveKeys(auth = {}) {
  const publicKey = auth.publicKey || process.env.CACHEROCKET_PUBLIC_KEY || process.env.CACHEROCKET_API_PUBLIC_KEY || "";
  const secretKey = auth.secretKey || process.env.CACHEROCKET_SECRET_KEY || process.env.CACHEROCKET_API_SECRET_KEY || process.env.CACHEROCKET_API_KEY || "";
  if (!publicKey || !secretKey) {
    throw new Error(
      "@cacherocket/next: missing API keys. Set CACHEROCKET_PUBLIC_KEY and CACHEROCKET_SECRET_KEY (server-only)."
    );
  }
  return { publicKey, secretKey };
}
function resolveSiteId(explicit) {
  const id = explicit || process.env.CACHEROCKET_SITE_ID || "";
  if (!id.trim()) {
    throw new Error(
      "@cacherocket/next: missing siteId. Set CACHEROCKET_SITE_ID or pass siteId."
    );
  }
  return id.trim();
}
async function uploadStatic(options = {}) {
  const siteId = resolveSiteId(options.siteId);
  const auth = resolveKeys(options);
  const dir = options.dir || (0, import_node_path.join)(process.cwd(), ".next", "static");
  const batchSize = Math.max(1, Math.min(40, options.batchSize ?? 30));
  const replace = options.replace !== false;
  const st = await (0, import_promises.stat)(dir).catch(() => null);
  if (!st?.isDirectory()) {
    throw new Error(
      `@cacherocket/next: static directory not found: ${dir}. Run next build first.`
    );
  }
  const absoluteFiles = await walkFiles(dir);
  if (!absoluteFiles.length) {
    throw new Error(`@cacherocket/next: no files found under ${dir}`);
  }
  const files = [];
  for (const abs of absoluteFiles) {
    const rel = (0, import_node_path.relative)(dir, abs).split("\\").join("/");
    const body = await (0, import_promises.readFile)(abs);
    files.push({
      path: `_next/static/${rel}`,
      contentBase64: body.toString("base64"),
      contentType: contentTypeFor(rel)
    });
  }
  let uploaded = 0;
  let batches = 0;
  let staticCdnUrl;
  for (let i = 0; i < files.length; i += batchSize) {
    const chunk = files.slice(i, i + batchSize);
    const data = await sitesUpload(
      siteId,
      {
        files: chunk,
        replace: replace && i === 0
      },
      auth,
      options.apiBaseUrl,
      options.organizationId
    );
    uploaded += data.uploaded ?? chunk.length;
    batches += 1;
    if (data.staticCdnUrl) staticCdnUrl = data.staticCdnUrl;
  }
  return { uploaded, batches, staticCdnUrl };
}

// src/server.ts
function resolveApiBase(explicit) {
  return (explicit || process.env.CACHEROCKET_API_BASE_URL || "https://api.cacherocket.com").replace(/\/+$/, "");
}
function resolveKeys2(auth = {}) {
  const publicKey = auth.publicKey || process.env.CACHEROCKET_PUBLIC_KEY || process.env.CACHEROCKET_API_PUBLIC_KEY || "";
  const secretKey = auth.secretKey || process.env.CACHEROCKET_SECRET_KEY || process.env.CACHEROCKET_API_SECRET_KEY || process.env.CACHEROCKET_API_KEY || "";
  if (!publicKey || !secretKey) {
    throw new Error(
      "@cacherocket/next: missing API keys. Set CACHEROCKET_PUBLIC_KEY and CACHEROCKET_SECRET_KEY (server-only)."
    );
  }
  return { publicKey, secretKey };
}
function resolveSiteId2(explicit) {
  const id = explicit || process.env.CACHEROCKET_SITE_ID || "";
  if (!id.trim()) {
    throw new Error(
      "@cacherocket/next: missing siteId. Set CACHEROCKET_SITE_ID or pass siteId."
    );
  }
  return id.trim();
}
async function sitesFetch(path, init) {
  const { publicKey, secretKey } = resolveKeys2(init.auth);
  const base = resolveApiBase(init.apiBaseUrl);
  const body = {
    ...init.body || {},
    publicKey,
    secretKey,
    ...init.organizationId ? { organizationId: init.organizationId } : {}
  };
  const res = await fetch(`${base}/web/v1/sites${path}`, {
    method: init.method || "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Public-Key": publicKey,
      "X-Secret-Key": secretKey
    },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `CacheRocket API error (${res.status})`);
  }
  return json.data;
}
async function warm(options = {}) {
  const siteId = resolveSiteId2(options.siteId);
  return sitesFetch(`/${siteId}/warm`, {
    method: "POST",
    auth: options,
    apiBaseUrl: options.apiBaseUrl,
    organizationId: options.organizationId,
    body: {
      urls: options.urls,
      crawlerId: options.crawlerId,
      hostname: options.hostname
    }
  });
}
async function purge(options = {}) {
  const siteId = resolveSiteId2(options.siteId);
  return sitesFetch(`/${siteId}/purge`, {
    method: "POST",
    auth: options,
    apiBaseUrl: options.apiBaseUrl,
    organizationId: options.organizationId,
    body: {
      urls: options.urls,
      rewarm: options.rewarm
    }
  });
}
function onVercelDeploy(options = {}) {
  return async function POST(req) {
    try {
      const incoming = await req.json().catch(() => ({}));
      const { publicKey, secretKey } = resolveKeys2(options);
      const base = resolveApiBase(options.apiBaseUrl);
      if (options.siteId || process.env.CACHEROCKET_SITE_ID) {
        const siteId = resolveSiteId2(options.siteId);
        const urls = [];
        if (typeof incoming.url === "string") urls.push(incoming.url);
        if (typeof incoming.deploymentUrl === "string") urls.push(incoming.deploymentUrl);
        if (Array.isArray(incoming.urls)) {
          for (const u of incoming.urls) {
            if (typeof u === "string") urls.push(u);
          }
        }
        const data = await sitesFetch(`/${siteId}/warm`, {
          method: "POST",
          auth: { publicKey, secretKey },
          apiBaseUrl: options.apiBaseUrl,
          organizationId: options.organizationId,
          body: { urls: urls.length ? urls : void 0 }
        });
        return Response.json({ success: true, data });
      }
      const res = await fetch(`${base}/web/v1/public/webhooks/vercel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Public-Key": publicKey,
          "X-Secret-Key": secretKey
        },
        body: JSON.stringify({
          ...incoming,
          publicKey,
          secretKey
        })
      });
      const json = await res.json().catch(() => ({}));
      return Response.json(json, { status: res.status });
    } catch (error) {
      return Response.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Deploy warm failed"
        },
        { status: 500 }
      );
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  onVercelDeploy,
  purge,
  uploadStatic,
  warm
});
//# sourceMappingURL=server.cjs.map