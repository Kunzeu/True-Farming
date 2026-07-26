/**
 * Enlaces a la wiki oficial de Guild Wars 2.
 * Español usa siempre la wiki en inglés (wiki-es incompleta).
 */

export type Gw2WikiLang = 'en' | 'es' | 'de' | 'fr' | string;

export function gw2WikiHost(lang: Gw2WikiLang): string {
  const wikiLang = lang === 'es' ? 'en' : lang;
  return wikiLang === 'en' ? 'wiki.guildwars2.com' : `wiki-${wikiLang}.guildwars2.com`;
}

/** Chat link de ítem (`[&Ag…]`) a partir del id de la API. */
export function itemChatLink(itemId: number): string {
  const bytes = [
    0x02,
    0x01,
    itemId & 0xff,
    (itemId >> 8) & 0xff,
    (itemId >> 16) & 0xff,
    (itemId >> 24) & 0xff,
  ];
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `[&${btoa(bin)}]`;
}

function wikiSearchUrl(host: string, query: string): string {
  return `https://${host}/index.php?title=Special:Search&search=${encodeURIComponent(query)}&go=Go`;
}

function wikiArticleUrl(host: string, itemName: string): string {
  const slug = itemName.trim().replace(/ /g, '_');
  return `https://${host}/wiki/${encodeURIComponent(slug)}`;
}

/**
 * @param itemName Nombre visible (puede estar localizado).
 * @param lang Idioma de la UI (es → host inglés).
 * @param options.englishName Título EN de la wiki (preferido en UI español).
 * @param options.itemId / chatLink Fallback fiable vía búsqueda por chat link.
 */
export function gw2WikiUrl(
  itemName: string,
  lang: Gw2WikiLang,
  options?: { itemId?: number; chatLink?: string; englishName?: string }
): string {
  const host = gw2WikiHost(lang);
  const chat =
    options?.chatLink ||
    (options?.itemId != null && options.itemId > 0 ? itemChatLink(options.itemId) : null);

  if (lang === 'es') {
    // 1) Título inglés → artículo directo
    if (options?.englishName) return wikiArticleUrl(host, options.englishName);
    // 2) Chat link → la wiki resuelve el ítem sin importar el idioma del nombre
    if (chat) return wikiSearchUrl(host, chat);
    // 3) Si el caller ya pasó nombre EN
    if (itemName) return wikiArticleUrl(host, itemName);
    return `https://${host}/wiki/Main_Page`;
  }

  if (itemName) return wikiArticleUrl(host, itemName);
  if (chat) return wikiSearchUrl(host, chat);
  return `https://${host}/wiki/Main_Page`;
}
