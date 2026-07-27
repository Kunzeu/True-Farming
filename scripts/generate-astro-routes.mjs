import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'src', 'app');
const pagesDir = path.join(root, 'src', 'pages');
const islandsDir = path.join(root, 'src', 'islands');
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ALL'];

const NO_NAV = new Set([
  'login',
  'register',
  'auth/check-email',
  'auth/forgot-password',
  'auth/verify-email',
  'auth/discord/callback',
  'auth/patreon/callback',
  'auth/patreon/link',
]);

const EAGER = new Set([
  'login',
  'register',
  'auth/check-email',
  'auth/forgot-password',
  'auth/verify-email',
  'auth/discord/callback',
  'auth/patreon/callback',
  'auth/patreon/link',
  'legendary-tracker',
]);

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function exportedMethods(routeFile) {
  const src = fs.readFileSync(routeFile, 'utf8');
  return METHODS.filter(
    (m) =>
      new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(src) ||
      new RegExp(`export\\s+const\\s+${m}\\b`).test(src)
  );
}

// Keep shared islands
const keepIslands = new Set(['_nav.tsx', '_chrome.tsx']);

// --- APIs ---
rmrf(path.join(pagesDir, 'api'));
const apiRoutes = walk(path.join(appDir, 'api')).filter((f) => f.endsWith(`${path.sep}route.ts`));

for (const routeFile of apiRoutes) {
  const rel = path.relative(path.join(appDir, 'api'), path.dirname(routeFile));
  const segments = rel.split(path.sep).filter(Boolean);
  const outFile = path.join(pagesDir, 'api', ...segments, 'index.ts');
  ensureDir(path.dirname(outFile));
  const importPath = '@/app/api/' + toPosix(path.join(rel, 'route'));
  const methods = exportedMethods(routeFile);
  if (!methods.length) continue;
  const exports = methods.map((m) => `export const ${m} = adapt(handlers.${m} as any);`).join('\n');
  fs.writeFileSync(
    outFile,
    `import * as handlers from '${importPath}';
import { adapt } from '@/lib/astro-api-adapt';

export const prerender = false;
${exports}
`
  );
}

// --- Wipe page islands only ---
ensureDir(islandsDir);
for (const f of fs.readdirSync(islandsDir)) {
  if (!keepIslands.has(f)) fs.unlinkSync(path.join(islandsDir, f));
}

const pageFiles = walk(appDir).filter(
  (f) => f.endsWith(`${path.sep}page.tsx`) && !f.includes(`${path.sep}api${path.sep}`)
);

for (const pageFile of pageFiles) {
  const relDir = path.relative(appDir, path.dirname(pageFile));
  const posixRel = toPosix(relDir);
  if (posixRel === 'festivals/wintersday/Orphan') continue;

  const islandName = (posixRel || 'home').replace(/\//g, '__');
  const islandFile = path.join(islandsDir, `${islandName}.tsx`);
  const pageImport = '@/app/' + (posixRel ? posixRel + '/' : '') + 'page';
  const isOrphanChild = posixRel.startsWith('festivals/wintersday/Orphan/');
  const showNav = !NO_NAV.has(posixRel) && !isOrphanChild;
  const eager = EAGER.has(posixRel);
  const clientDir = eager ? 'client:load' : 'client:idle';
  const layoutProps = `showNav={${showNav}}`;

  const pageTitle =
    !posixRel || posixRel === '.'
      ? 'True Farming - Guild Wars 2 Farming'
      : `${posixRel
          .split('/')
          .map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
          .join(' / ')} - True Farming`;
  const pageDescription =
    'True Farming - Guild Wars 2 tools for farming routes, salvage, festivals, legendary tracker and more.';

  const islandBody = isOrphanChild
    ? `'use client';

import Providers from '@/components/Providers';
import OrphanShell from '@/app/festivals/wintersday/Orphan/layout';
import Page from '${pageImport}';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function Island({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <OrphanShell>
        <Page />
      </OrphanShell>
    </Providers>
  );
}
`
    : `'use client';

import Providers from '@/components/Providers';
import Page from '${pageImport}';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function Island({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <Page />
    </Providers>
  );
}
`;
  fs.writeFileSync(islandFile, islandBody);

  const outDir = relDir ? path.join(pagesDir, relDir) : pagesDir;
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, 'index.astro'),
    `---
import Layout from '@/layouts/Layout.astro';
import Island from '@/islands/${islandName}';

const langCookie = Astro.cookies.get('tf_lang')?.value;
const lang =
  langCookie === 'de' || langCookie === 'es' || langCookie === 'fr' || langCookie === 'en'
    ? langCookie
    : 'en';
---

<Layout ${layoutProps} title={${JSON.stringify(pageTitle)}} description={${JSON.stringify(pageDescription)}}>
  <Island ${clientDir} lang={lang} />
</Layout>
`
  );
  console.log('page', posixRel || '/', clientDir, showNav ? 'nav' : 'no-nav');
}

fs.writeFileSync(
  path.join(islandsDir, 'not-found.tsx'),
  `'use client';

import Providers from '@/components/Providers';
import NotFound from '@/app/not-found';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function Island({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <NotFound />
    </Providers>
  );
}
`
);
fs.writeFileSync(
  path.join(pagesDir, '404.astro'),
  `---
import Layout from '@/layouts/Layout.astro';
import Island from '@/islands/not-found';

const langCookie = Astro.cookies.get('tf_lang')?.value;
const lang =
  langCookie === 'de' || langCookie === 'es' || langCookie === 'fr' || langCookie === 'en'
    ? langCookie
    : 'en';
---

<Layout title="Not Found">
  <Island client:idle lang={lang} />
</Layout>
`
);

console.log('done', { apis: apiRoutes.length, pages: pageFiles.length });
