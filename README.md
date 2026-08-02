# @cacherocket/next

CacheRocket for Next.js — **image CDN + optional `/_next/static` CDN + cache warming** that sits beside Vercel, Netlify, Cloudflare Pages, or self-hosted Node. You keep hosting/SSR where it is; CacheRocket optimizes and delivers images (and optionally hashed static assets) and warms caches after deploy.

## Install

Published to **GitHub Packages** (not npmjs.org).

Add to your project `.npmrc`:

```ini
@cacherocket:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm i @cacherocket/next@0.2.0
```

Alternatively (no Packages registry):

```bash
npm i github:CacheRocket/cacherocket-next#v0.2.0
```

```env
# Public — safe in the browser / image URLs
CACHEROCKET_SITE_TOKEN=site_xxx
# Absolute origin for relative /public images (optional but recommended)
CACHEROCKET_ASSET_ORIGIN=https://www.example.com

# Optional — customer static CDN (/_next/static). From Account → Next.js when enabled.
# Do NOT use CacheRocket.com's internal CACHEROCKET_CDN_URL here.
CACHEROCKET_STATIC_CDN_URL=https://assets.cacherocket.com/org_…/site_…/static

# Server-only — warm / purge / deploy hooks / static upload
CACHEROCKET_PUBLIC_KEY=...
CACHEROCKET_SECRET_KEY=...
CACHEROCKET_SITE_ID=...
```

Create a Next.js site in the CacheRocket dashboard (**Account → Next.js**) to get these values.

## next.config

```ts
import type { NextConfig } from 'next'
import { withCacheRocket } from '@cacherocket/next'

const nextConfig: NextConfig = {
  // your config
}

export default withCacheRocket(
  {
    siteToken: process.env.CACHEROCKET_SITE_TOKEN,
    assetOrigin: process.env.CACHEROCKET_ASSET_ORIGIN,
    // Optional: sets Next.js assetPrefix for /_next/static only
    staticCdnUrl: process.env.CACHEROCKET_STATIC_CDN_URL,
  },
  nextConfig
)
```

## Images

Use `next/image` as usual with **absolute** image URLs (or relative paths when `CACHEROCKET_ASSET_ORIGIN` is set):

```tsx
import Image from 'next/image'

export function Hero() {
  return (
    <Image
      src="https://cdn.shopify.com/.../hero.jpg"
      width={1200}
      height={630}
      alt="Hero"
    />
  )
}
```

Loader output (path-based transforms for reliable CDN caching):

```text
https://img.cacherocket.com/i/site_xxx/w_1200,q_75,f_auto/https%3A%2F%2F...
```

Images are served from **`img.cacherocket.com`**. If a plan or monthly transform quota is exceeded, CacheRocket soft-fails by redirecting to the original image URL so the page still loads.

## Static asset CDN (`/_next/static`)

Optional. Enable **Static asset CDN** on **Account → Next.js** (requires Managed CDN on your plan). Then:

1. Set `CACHEROCKET_STATIC_CDN_URL` to the `staticCdnUrl` shown in the dashboard (also passed to `withCacheRocket`).
2. After every `next build`, upload hashed assets:

```bash
npx cacherocket-next upload-static
```

Or from a script:

```ts
import { uploadStatic } from '@cacherocket/next/server'

await uploadStatic()
```

Files land in OVH under `org_…/site_…/static/_next/static/…` and are served via Bunny on `assets.cacherocket.com`. HTML/SSR stay on your host. Bandwidth uses the shared Managed CDN meter.

## Warm on deploy (Vercel)

```ts
// app/api/cacherocket/deploy/route.ts
import { onVercelDeploy } from '@cacherocket/next/server'

export const POST = onVercelDeploy()
```

Point a Vercel Deploy Hook (or webhook) at `/api/cacherocket/deploy`.

Or call from a script:

```ts
import { warm, purge } from '@cacherocket/next/server'

await warm({ urls: ['https://www.example.com/'] })
await purge({ rewarm: true }) // also clears static CDN objects for the site
```

## API

| Export | Package path | Purpose |
|--------|--------------|---------|
| `withCacheRocket` | `@cacherocket/next` | next.config helper (image loader + optional `assetPrefix`) |
| default loader | `@cacherocket/next/image-loader` | custom `next/image` loader |
| `warm` / `purge` / `onVercelDeploy` / `uploadStatic` | `@cacherocket/next/server` | server-only helpers |
| CLI `upload-static` | `cacherocket-next` bin | post-build static upload |

Backend: `https://api.cacherocket.com/web/v1/sites`

## Not in this package

- Full-site DNS / HTML reverse proxy
- Critical CSS / LQIP (WordPress-oriented)
- CacheRocket.com’s own frontend `CACHEROCKET_CDN_URL` (internal only)

## License

MIT
