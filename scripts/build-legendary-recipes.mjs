/**
 * Genera src/data/legendary-recipes.json (y una copia en public/data).
 *
 * Cubre armas, armadura, mochilas y trinkets legendarios. La API de GW2 no
 * publica las recetas de la Forja Mística, así que se extraen del wiki.
 *
 * Uso: node scripts/build-legendary-recipes.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'src', 'data', 'legendary-recipes.json');
const publicOut = path.join(root, 'public', 'data', 'legendary-recipes.json');

const WIKI = 'https://wiki.guildwars2.com/api.php';
const API = 'https://api.guildwars2.com/v2';
const MAX_DEPTH = 8;
const HEADERS = { 'User-Agent': 'TrueFarming/1.0 (https://truefarming.com)' };

const ARMOR_CATEGORIES = [
  'Category:Obsidian armor',
  'Category:Perfected Envoy armor',
  'Category:Suffused Obsidian armor',
  "Category:Triumphant Hero's armor",
  "Category:Mistforged Triumphant Hero's armor",
  'Category:Ardent Glorious armor',
  "Category:Glorious Hero's armor",
  "Category:Mistforged Glorious Hero's armor",
];

const BACKPACK_TITLES = ['Ad Infinitum', 'The Ascension', 'Warbringer', 'Orrax Manifested'];

const TRINKET_TITLES = [
  'Aurora',
  'Vision',
  'Coalescence',
  'Conflux',
  'Transcendence',
  "Prismatic Champion's Regalia",
  'Endless Summer',
  'Stella Radians',
  'Strife Unending',
];

const EXTRA_ARMOR_TITLES = ['Eikasia, Mists-Grasper', 'Selachimorpha'];

const SKIP_TITLE =
  /^(Legendary |Category:)|armor \((heavy|light|medium)\)$|^(Obsidian|Perfected Envoy|Suffused Obsidian|Triumphant Hero'?s|Mistforged Triumphant Hero'?s|Ardent Glorious|Glorious Hero'?s|Mistforged Glorious Hero'?s) armor$|Backpacks$|trinket$|Skin$/i;

const ARMOR_PIECE =
  /(Helmet|Crown|Mask|Cowl|Pauldrons|Shoulders|Shoulderpads|Mantle|Breastplate|Jacket|Jerkin|Regalia|Vestments|Gauntlets|Gloves|Vambraces|Cuisses|Leggings|Pants|Tassets|Greaves|Boots|Shoes|Headgear)/i;

function getJson(url) {
  return fetch(url, { headers: HEADERS }).then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  });
}

const LEAVES = new Set([
  'Mystic Clover',
  'Glob of Ectoplasm',
  'Mystic Coin',
  'Obsidian Shard',
  "Philosopher's Stone",
  'Bloodstone Shard',
  'Gift of Exploration',
  'Gift of Battle',
  'Spirit Shard',
  'Pile of Bloodstone Dust',
  'Dragonite Ore',
  'Empyreal Fragment',
]);

const LEAF_IDS = new Set([
  19675, 19925, 20796, 20797, 19721, 19976, 19677, 19678, 38014, 38023,
]);

async function categoryMembers(cmtitle) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'categorymembers',
    cmtitle,
    cmlimit: '500',
    format: 'json',
    formatversion: '2',
  });
  const json = await getJson(`${WIKI}?${params}`);
  return (json.query?.categorymembers ?? []).map((m) => m.title);
}

async function wikitext(titles) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    redirects: '1',
    format: 'json',
    formatversion: '2',
    titles: titles.join('|'),
  });
  const json = await getJson(`${WIKI}?${params}`);
  const byTitle = new Map();
  for (const page of json.query?.pages ?? []) {
    const text = page.revisions?.[0]?.slots?.main?.content;
    if (text) byTitle.set(page.title, text);
  }
  for (const r of json.query?.redirects ?? []) {
    if (byTitle.has(r.to)) byTitle.set(r.from, byTitle.get(r.to));
  }
  for (const n of json.query?.normalized ?? []) {
    if (byTitle.has(n.to)) byTitle.set(n.from, byTitle.get(n.to));
  }
  return byTitle;
}

function cleanLinks(value) {
  return value
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function infoboxId(text) {
  const match = text.match(/\|\s*id\s*=\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function infoboxField(text, field) {
  const match = text.match(new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\n|]+)`, 'i'));
  return match ? cleanLinks(match[1]) : null;
}

function recipeBlocks(text) {
  const blocks = [];
  const re = /\{\{\s*recipe\b/gi;
  let match;
  while ((match = re.exec(text))) {
    let depth = 0;
    let i = match.index;
    for (; i < text.length; i++) {
      if (text.startsWith('{{', i)) depth++;
      else if (text.startsWith('}}', i)) {
        depth--;
        if (depth === 0) break;
      }
    }
    blocks.push(text.slice(match.index, i + 2));
  }
  return blocks;
}

function parseRecipe(block) {
  const fields = new Map();
  for (const raw of block.slice(2, -2).split('\n|').slice(1)) {
    const eq = raw.indexOf('=');
    if (eq === -1) continue;
    fields.set(raw.slice(0, eq).trim().toLowerCase(), cleanLinks(raw.slice(eq + 1)));
  }
  const ingredients = [];
  for (let n = 1; n <= 12; n++) {
    const value = fields.get(`ingredient${n}`);
    if (!value) continue;
    const counted = value.match(/^(\d+)\s+(.+)$/);
    ingredients.push({
      name: counted ? counted[2].trim() : value,
      count: counted ? Number(counted[1]) : Number(fields.get(`count${n}`) ?? 1),
    });
  }
  if (!ingredients.length) return null;
  return {
    source: fields.get('source') || fields.get('discipline') || 'Crafting',
    output: Number(fields.get('output qty') ?? fields.get('output') ?? 1) || 1,
    ingredients,
  };
}

function pickRecipe(text, title) {
  const usedIn = text.search(/^\s*==+\s*Used in/im);
  const acquisition = usedIn === -1 ? text : text.slice(0, usedIn);
  const singular = (s) => s.replace(/s$/i, '').toLowerCase();
  const fromAcquisition = recipeBlocks(acquisition)
    .map(parseRecipe)
    .filter(Boolean)
    .filter((r) => !r.ingredients.some((i) => singular(i.name) === singular(title)));
  // fallback: recetas ocultas fuera de Acquisition (Gift of Glory / War)
  const pool =
    fromAcquisition.length > 0
      ? fromAcquisition
      : recipeBlocks(text)
          .map(parseRecipe)
          .filter(Boolean)
          .filter((r) => !r.ingredients.some((i) => singular(i.name) === singular(title)));
  if (!pool.length) return null;
  return pool.find((r) => /mystic forge/i.test(r.source)) ?? pool[0];
}

async function apiBatch(endpoint, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 180) {
    const chunk = ids.slice(i, i + 180);
    const url = `${API}/${endpoint}?ids=${chunk.join(',')}`;
    for (let attempt = 1; ; attempt++) {
      try {
        out.push(...(await getJson(url)));
        break;
      } catch (err) {
        if (String(err.message).startsWith('404') || attempt === 4) {
          if (attempt === 4) console.warn(`  lote fallido tras 4 intentos: ${err.message}`);
          break;
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  return out;
}

function armorSet(title) {
  if (/Perfected Envoy/i.test(title)) return 'Perfected Envoy';
  if (/Suffused Obsidian/i.test(title)) return 'Suffused Obsidian';
  if (/Obsidian/i.test(title)) return 'Obsidian';
  if (/Mistforged Triumphant/i.test(title)) return 'Mistforged Triumphant';
  if (/Triumphant Hero/i.test(title)) return 'Triumphant Hero';
  if (/Mistforged Glorious/i.test(title)) return 'Mistforged Glorious';
  if (/Ardent Glorious/i.test(title)) return 'Ardent Glorious';
  if (/Glorious Hero/i.test(title)) return 'Glorious Hero';
  if (/Eikasia/i.test(title)) return 'Eikasia';
  if (/Selachimorpha/i.test(title)) return 'Selachimorpha';
  return null;
}

function weaponGen(title, ingredientIds) {
  if (title.startsWith("Aurene's")) return 3;
  if (ingredientIds.includes(19626)) return 1;
  if (ingredientIds.includes(71820) || ingredientIds.includes(96033)) return 2;
  return 2;
}

async function collectSeeds() {
  const seeds = [];

  const weapons = (await categoryMembers('Category:Legendary weapons')).filter(
    (t) => !t.startsWith('Legendary weapon')
  );
  for (const title of weapons) seeds.push({ title, kind: 'weapon' });

  for (const cat of ARMOR_CATEGORIES) {
    for (const title of await categoryMembers(cat)) {
      if (SKIP_TITLE.test(title)) continue;
      if (!ARMOR_PIECE.test(title)) continue;
      seeds.push({ title, kind: 'armor' });
    }
  }
  for (const title of EXTRA_ARMOR_TITLES) seeds.push({ title, kind: 'armor' });

  const backs = await categoryMembers('Category:Legendary back items');
  for (const title of [...new Set([...BACKPACK_TITLES, ...backs])]) {
    if (SKIP_TITLE.test(title) || title === 'Legendary back item') continue;
    seeds.push({ title, kind: 'backpack' });
  }

  for (const title of TRINKET_TITLES) seeds.push({ title, kind: 'trinket' });

  const order = { weapon: 0, armor: 1, backpack: 2, trinket: 3 };
  const byTitle = new Map();
  for (const seed of seeds) {
    const prev = byTitle.get(seed.title);
    if (!prev || order[seed.kind] < order[prev.kind]) byTitle.set(seed.title, seed);
  }
  return [...byTitle.values()];
}

async function main() {
  const seeds = await collectSeeds();
  const kindByTitle = new Map(seeds.map((s) => [s.title, s.kind]));
  const legendaryTitles = seeds.map((s) => s.title);
  console.log(
    `Seeds: ${legendaryTitles.length} (W${seeds.filter((s) => s.kind === 'weapon').length} A${seeds.filter((s) => s.kind === 'armor').length} B${seeds.filter((s) => s.kind === 'backpack').length} T${seeds.filter((s) => s.kind === 'trinket').length})`
  );

  const pages = new Map();
  let frontier = legendaryTitles;
  const seen = new Set(frontier);

  for (let depth = 0; depth <= MAX_DEPTH && frontier.length; depth++) {
    const next = [];
    for (let i = 0; i < frontier.length; i += 20) {
      const batch = frontier.slice(i, i + 20);
      const texts = await wikitext(batch);
      for (const title of batch) {
        const text = texts.get(title);
        if (!text) {
          console.warn(`  sin wikitext: ${title}`);
          continue;
        }
        const id = infoboxId(text);
        const recipe = LEAVES.has(title) ? null : pickRecipe(text, title);
        pages.set(title, {
          id,
          recipe,
          type: infoboxField(text, 'type'),
          kind: kindByTitle.get(title),
        });
        if (!recipe) continue;
        for (const ing of recipe.ingredients) {
          if (seen.has(ing.name)) continue;
          seen.add(ing.name);
          next.push(ing.name);
        }
      }
    }
    console.log(`  nivel ${depth}: ${frontier.length} páginas, ${next.length} nuevas`);
    frontier = next;
  }

  const ids = [...new Set([...pages.values()].map((p) => p.id).filter(Boolean))];
  const items = await apiBatch('items', ids);
  const itemsById = new Map(items.map((it) => [it.id, it]));
  const prices = await apiBatch('commerce/prices', ids);
  const tradeable = new Set(prices.map((p) => p.id));

  const idByName = new Map();
  for (const [name, page] of pages) if (page.id) idByName.set(name, page.id);

  const recipes = {};
  for (const [name, page] of pages) {
    if (!page.id || !page.recipe || LEAF_IDS.has(page.id)) continue;
    const ingredients = [];
    const extras = [];
    for (const ing of page.recipe.ingredients) {
      const id = idByName.get(ing.name);
      if (id) ingredients.push({ id, count: ing.count });
      else extras.push({ name: ing.name, count: ing.count });
    }
    if (!ingredients.length && !extras.length) continue;
    recipes[page.id] = {
      name,
      source: page.recipe.source,
      output: page.recipe.output,
      ingredients,
      ...(extras.length ? { extras } : {}),
    };
  }

  const meta = {};
  for (const [name, page] of pages) {
    if (!page.id) continue;
    const item = itemsById.get(page.id);
    meta[page.id] = {
      name: item?.name ?? name,
      icon: item?.icon ?? null,
      rarity: item?.rarity ?? null,
      tradeable: tradeable.has(page.id),
    };
  }

  const legendaries = legendaryTitles
    .map((title) => {
      const page = pages.get(title);
      if (!page?.id || !page.recipe) return null;

      const item = itemsById.get(page.id);
      // solo piezas realmente legendarias (precursores exotic fuera)
      if (item && item.rarity !== 'Legendary') return null;

      const kind = page.kind ?? 'weapon';
      const ingredientIds = recipes[page.id]?.ingredients.map((i) => i.id) ?? [];
      const gen = kind === 'weapon' ? weaponGen(title, ingredientIds) : 0;
      return {
        id: page.id,
        name: item?.name ?? title,
        type: item?.details?.type ?? page.type ?? null,
        kind,
        set: kind === 'armor' ? armorSet(title) : null,
        gen,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        String(a.kind).localeCompare(String(b.kind)) ||
        a.gen - b.gen ||
        String(a.set ?? '').localeCompare(String(b.set ?? '')) ||
        a.name.localeCompare(b.name)
    );

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.mkdirSync(path.dirname(publicOut), { recursive: true });
  const payload = JSON.stringify({
    generatedAt: new Date().toISOString(),
    legendaries,
    recipes,
    items: meta,
  });
  fs.writeFileSync(outFile, payload);
  fs.writeFileSync(publicOut, payload);

  const counts = legendaries.reduce((acc, l) => {
    acc[l.kind] = (acc[l.kind] || 0) + 1;
    return acc;
  }, {});
  console.log(
    `OK -> ${path.relative(root, outFile)} | ${legendaries.length} legendarias`,
    counts,
    `| ${Object.keys(recipes).length} recetas, ${Object.keys(meta).length} items`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
