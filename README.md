# @cacherocket/next

CacheRocket for Next.js — **image CDN + cache warming** that sits beside Vercel, Netlify, or Cloudflare Pages. You keep hosting/SSR where it is; CacheRocket optimizes and delivers images and warms caches after deploy.

## Install

Published to **GitHub Packages** (not npmjs.org).

Add to your project `.npmrc`:

```ini
@cacherocket:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Use a GitHub PAT (classic) with `read:packages` as `GITHUB_TOKEN`, or for public packages after the package visibility is set to public you may still need auth depending on org settings.

```bash
npm i @cacherocket/next@0.1.3
```

Alternatively (no Packages registry):

```bash
npm i github:CacheRocket/cacherocket-next#v0.1.3
```

```env
# Public — safe in the browser / image URLs
CACHEROCKET_SITE_TOKEN=site_xxx
# Absolute origin for relative /public images (optional but recommended)
CACHEROCKET_ASSET_ORIGIN=https://www.example.com

# Server-only — warm / purge / deploy hooks
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
await purge({ rewarm: true })
```

## API

| Export | Package path | Purpose |
|--------|--------------|---------|
| `withCacheRocket` | `@cacherocket/next` | next.config helper |
| default loader | `@cacherocket/next/image-loader` | custom `next/image` loader |
| `warm` / `purge` / `onVercelDeploy` | `@cacherocket/next/server` | server-only helpers |

Backend: `https://api.cacherocket.com/web/v1/sites`

## Not in v0.1

- `assetPrefix` for `/_next/static` (keep on Vercel; optional later)
- Full-site DNS / HTML reverse proxy
- Critical CSS / LQIP (WordPress-oriented)

## License

MIT
