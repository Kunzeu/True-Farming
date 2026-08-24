import defaultsJson from './four-winds-defaults.json';

export type BoxOpeningYearData = {
  boxes: number;
  ids: number[];
  counts: number[];
};

export type FourWindsBoxCalculatorItem = {
  id: number;
  name: string;
  numPerBox: number;
  pricePerUnit: number;
};

export type FourWindsConfig = {
  boxOpening: Record<string, BoxOpeningYearData>;
  boxCalculator: FourWindsBoxCalculatorItem[];
  tokensPerTome: number;
};

export const FOUR_WINDS_CONFIG_SECRET_KEY = 'four_winds_config';
// ponytail: un solo slot de backup (el anterior al último save)
export const FOUR_WINDS_CONFIG_BACKUP_KEY = 'four_winds_config_backup';
export const FESTIVAL_TOKEN_ITEM_ID = 66224;
export const FESTIVAL_TOKEN_CURRENCY_ID = 50;

export const DEFAULT_FOUR_WINDS_CONFIG: FourWindsConfig = defaultsJson as FourWindsConfig;

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        q = !q;
      }
    } else if (ch === delim && !q) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function detectDelim(sample: string): string {
  const counts = [
    [',', (sample.match(/,/g) || []).length],
    ['\t', (sample.match(/\t/g) || []).length],
    [';', (sample.match(/;/g) || []).length],
  ] as const;
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}

/** CSV: item_id,item_name,item_amount,... — negativos = cajas abiertas */
export function parseBoxOpeningCsv(csv: string): BoxOpeningYearData {
  const text = csv.replace(/^\uFEFF/, '').trim();
  if (!text) return { boxes: 0, ids: [], counts: [] };
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const delim = detectDelim(lines.slice(0, 5).join('\n'));
  const first = splitCsvLine(lines[0], delim).map((c) => c.toLowerCase());
  const hasHeader = first.some((c) => c.includes('item_id') || c === 'id' || c.includes('item_amount'));
  let idCol = 0;
  let amtCol = first.length >= 3 ? 2 : 1;
  let curIdCol = -1;
  let curAmtCol = -1;
  if (hasHeader) {
    const iId = first.findIndex((c) => c === 'item_id' || c === 'id');
    const iAmt = first.findIndex((c) => c === 'item_amount' || c === 'amount' || c === 'qty' || c === 'quantity');
    if (iId >= 0) idCol = iId;
    if (iAmt >= 0) amtCol = iAmt;
    curIdCol = first.findIndex((c) => c === 'currency_id');
    curAmtCol = first.findIndex((c) => c === 'currency_amount');
  }
  const byId: Record<number, number> = {};
  let boxesFromNeg = 0;
  for (const line of lines.slice(hasHeader ? 1 : 0)) {
    const cols = splitCsvLine(line, delim);
    const id = Number(cols[idCol]);
    if (id) {
      const amt = Number(String(cols[amtCol] ?? '').replace(/[^\d.-]/g, '')) || 0;
      if (amt < 0) {
        boxesFromNeg += Math.abs(amt);
      } else {
        byId[id] = (byId[id] || 0) + amt;
      }
    }
    if (curIdCol >= 0 && curAmtCol >= 0) {
      const cid = Number(cols[curIdCol]);
      const camt = Number(String(cols[curAmtCol] ?? '').replace(/[^\d.-]/g, '')) || 0;
      if (cid === FESTIVAL_TOKEN_CURRENCY_ID && camt > 0) {
        byId[FESTIVAL_TOKEN_ITEM_ID] = (byId[FESTIVAL_TOKEN_ITEM_ID] || 0) + camt;
      }
    }
  }
  const ids = Object.keys(byId).map(Number);
  return {
    boxes: boxesFromNeg || 0,
    ids,
    counts: ids.map((id) => byId[id]),
  };
}

export function mergeOpeningCsv(
  existing: BoxOpeningYearData | undefined,
  csv: string
): BoxOpeningYearData {
  const parsed = parseBoxOpeningCsv(csv);
  if (!existing) return parsed;
  const byId: Record<number, number> = {};
  existing.ids.forEach((id, i) => {
    byId[id] = existing.counts[i] ?? 0;
  });
  parsed.ids.forEach((id, i) => {
    byId[id] = (byId[id] || 0) + (parsed.counts[i] ?? 0);
  });
  const ids = Object.keys(byId).map(Number);
  return {
    boxes: parsed.boxes ? (existing.boxes || 0) + parsed.boxes : (existing.boxes || 0),
    ids,
    counts: ids.map((id) => byId[id]),
  };
}

export function normalizeFourWindsConfig(raw: unknown): FourWindsConfig {
  const base = structuredClone(DEFAULT_FOUR_WINDS_CONFIG);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<FourWindsConfig>;
  if (r.boxOpening && typeof r.boxOpening === 'object') {
    base.boxOpening = r.boxOpening as FourWindsConfig['boxOpening'];
  }
  if (Array.isArray(r.boxCalculator) && r.boxCalculator.length) {
    base.boxCalculator = r.boxCalculator;
  }
  if (typeof r.tokensPerTome === 'number' && r.tokensPerTome > 0) {
    base.tokensPerTome = r.tokensPerTome;
  }
  return base;
}

export function validateFourWindsConfig(cfg: FourWindsConfig): string | null {
  if (!cfg.boxOpening || !Object.keys(cfg.boxOpening).length) return 'boxOpening vacío';
  for (const [year, data] of Object.entries(cfg.boxOpening)) {
    if (!data.boxes || data.boxes < 1) return `${year}: boxes inválido`;
    if (!data.ids?.length || data.ids.length !== data.counts?.length) {
      return `${year}: ids/counts no coinciden`;
    }
  }
  if (!cfg.boxCalculator?.length) return 'boxCalculator vacío';
  for (const item of cfg.boxCalculator) {
    if (!item.id || item.numPerBox == null) return `item inválido: ${item.id}`;
  }
  if (!cfg.tokensPerTome || cfg.tokensPerTome < 1) return 'tokensPerTome inválido';
  return null;
}
