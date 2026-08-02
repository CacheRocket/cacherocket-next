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
  warm: () => warm
});
module.exports = __toCommonJS(server_exports);
function resolveApiBase(explicit) {
  return (explicit || process.env.CACHEROCKET_API_BASE_URL || "https://api.cacherocket.com").replace(/\/+$/, "");
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
async function sitesFetch(path, init) {
  const { publicKey, secretKey } = resolveKeys(init.auth);
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
  const siteId = resolveSiteId(options.siteId);
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
  const siteId = resolveSiteId(options.siteId);
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
      const { publicKey, secretKey } = resolveKeys(options);
      const base = resolveApiBase(options.apiBaseUrl);
      if (options.siteId || process.env.CACHEROCKET_SITE_ID) {
        const siteId = resolveSiteId(options.siteId);
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
  warm
});
//# sourceMappingURL=server.cjs.map