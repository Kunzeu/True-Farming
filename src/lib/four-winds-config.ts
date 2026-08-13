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

export const DEFAULT_FOUR_WINDS_CONFIG: FourWindsConfig = defaultsJson as FourWindsConfig;

/** CSV: item_id,item_name,item_amount,... — negativos en 88145 = cajas abiertas */
export function parseBoxOpeningCsv(csv: string): BoxOpeningYearData {
  const byId: Record<number, number> = {};
  let boxesFromNeg = 0;
  for (const line of csv.trim().split(/\r?\n/).slice(1)) {
    const [idRaw, , amtRaw] = line.split(',');
    const id = Number(idRaw);
    if (!id) continue;
    const amt = Number(amtRaw) || 0;
    if (amt < 0) {
      boxesFromNeg += Math.abs(amt);
      continue;
    }
    byId[id] = (byId[id] || 0) + amt;
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
    boxes: (existing.boxes || 0) + (parsed.boxes || 0),
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
