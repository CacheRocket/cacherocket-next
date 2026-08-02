#!/usr/bin/env node

// src/uploadStatic.ts
import { readdir, readFile, stat } from "fs/promises";
import { join, relative } from "path";
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
  const dir = options.dir || join(process.cwd(), ".next", "static");
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
  const files = [];
  for (const abs of absoluteFiles) {
    const rel = relative(dir, abs).split("\\").join("/");
    const body = await readFile(abs);
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

// src/cli.ts
async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd || cmd === "--help" || cmd === "-h") {
    printHelp();
    process.exit(cmd ? 0 : 1);
  }
  if (cmd === "upload-static") {
    let dir;
    let replace = true;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "--dir" && args[i + 1]) {
        dir = args[++i];
      } else if (a === "--no-replace") {
        replace = false;
      } else if (a === "--help" || a === "-h") {
        console.log(`Usage: cacherocket-next upload-static [--dir .next/static] [--no-replace]

Uploads Next.js hashed static assets to CacheRocket Managed CDN.
Requires CACHEROCKET_PUBLIC_KEY, CACHEROCKET_SECRET_KEY, CACHEROCKET_SITE_ID
and static CDN enabled for the site in Account \u2192 Next.js.`);
        process.exit(0);
      }
    }
    const result = await uploadStatic({ dir, replace });
    console.log(
      `@cacherocket/next: uploaded ${result.uploaded} files in ${result.batches} batch(es)` + (result.staticCdnUrl ? `
assetPrefix: ${result.staticCdnUrl}` : "")
    );
    return;
  }
  console.error(`Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}
function printHelp() {
  console.log(`CacheRocket Next.js CLI

Commands:
  upload-static   Upload .next/static to Managed CDN (customer sites)

Examples:
  npx cacherocket-next upload-static
  npx cacherocket-next upload-static --dir .next/static`);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
//# sourceMappingURL=cli.js.map