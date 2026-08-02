import { uploadStatic } from './uploadStatic';

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === '--help' || cmd === '-h') {
    printHelp();
    process.exit(cmd ? 0 : 1);
  }

  if (cmd === 'upload-static') {
    let dir: string | undefined;
    let replace = true;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--dir' && args[i + 1]) {
        dir = args[++i];
      } else if (a === '--no-replace') {
        replace = false;
      } else if (a === '--help' || a === '-h') {
        console.log(`Usage: cacherocket-next upload-static [--dir .next/static] [--no-replace]

Uploads Next.js hashed static assets to CacheRocket Managed CDN.
Requires CACHEROCKET_PUBLIC_KEY, CACHEROCKET_SECRET_KEY, CACHEROCKET_SITE_ID
and static CDN enabled for the site in Account → Next.js.`);
        process.exit(0);
      }
    }

    const result = await uploadStatic({ dir, replace });
    console.log(
      `@cacherocket/next: uploaded ${result.uploaded} files in ${result.batches} batch(es)` +
        (result.staticCdnUrl ? `\nassetPrefix: ${result.staticCdnUrl}` : '')
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
