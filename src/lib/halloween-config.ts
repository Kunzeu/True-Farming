import { mergeOpeningCsv, parseBoxOpeningCsv, type BoxOpeningYearData } from '@/lib/four-winds-config';

export type HalloweenOpening = BoxOpeningYearData;

export type HalloweenConfig = {
  boxOpening: Record<string, HalloweenOpening>;
};

const DEFAULT_IDS = [
  36059, 36060, 36061, 36076, 36074, 36041, 67379, 36084, 36081, 67371, 67367, 67368, 36080, 36077, 79679, 79673, 79677, 67386, 67382, 67366, 79647, 67370, 67372, 67375, 71931, 48807, 48805, 48806, 36046, 36048, 36050, 36063, 36065, 36067, 67381, 79638, 79637, 79690, 76642, 76131, 71946, 70732, 89036, 89051, 88997, 79684, 24300, 24277, 24283, 24289, 24295, 24358, 24351, 24357, 36101, 36106, 36102, 36103, 67369, 67380, 36045, 36047, 36049, 36062, 36064, 36066, 67365, 67383, 76569, 88998, 89002, 36109, 36108, 36107, 36095, 72113, 92128, 89065, 79674, 36069, 36058, 36072, 85384, 89071, 24791, 89007, 45177, 46733, 46735, 43772, 46731, 45176, 36409, 36408, 36032, 36031, 45178, 45179,
];

const DEFAULT_COUNTS = [
  277294, 277460, 277552, 19045, 19797, 962530, 4825, 9807, 9570, 21333, 20798, 20658, 10679, 13099, 13302, 13265, 13202, 9, 3, 9, 11, 11, 9, 17, 14, 26, 17, 6, 6, 14, 6, 6, 11, 9, 14, 6, 6, 11, 3, 17, 11, 11, 11, 26, 3, 14, 140, 260, 120, 290, 170, 200, 170, 230, 9, 17, 26, 34, 20, 11, 11, 14, 26, 29, 23, 23, 17, 43, 74, 43, 10725, 1682, 1399, 1630, 1519, 14, 9, 1, 2, 4, 5, 5, 11, 18, 11, 7, 14560, 69684, 65337, 352, 69469, 20272, 4831, 4893, 14223, 15358, 9718, 31,
];

export const HALLOWEEN_CONFIG_SECRET_KEY = 'halloween_config';
export const HALLOWEEN_CONFIG_BACKUP_KEY = 'halloween_config_backup';

const EMPTY_YEAR: HalloweenOpening = { boxes: 0, ids: [], counts: [] };

/** 280.000 cajas son de 2025. 2026 empieza vacío hasta el CSV de este año. */
export const DEFAULT_HALLOWEEN_CONFIG: HalloweenConfig = {
  boxOpening: {
    '2025': { boxes: 280000, ids: DEFAULT_IDS, counts: DEFAULT_COUNTS },
    '2026': { ...EMPTY_YEAR },
  },
};

export { mergeOpeningCsv, parseBoxOpeningCsv };

function asYear(data: unknown): HalloweenOpening | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Partial<HalloweenOpening>;
  const ids = Array.isArray(d.ids) ? d.ids.map(Number) : [];
  const counts = Array.isArray(d.counts) ? d.counts.map(Number) : [];
  if (ids.length !== counts.length) return null;
  return { boxes: typeof d.boxes === 'number' && d.boxes > 0 ? d.boxes : 0, ids, counts };
}

export function normalizeHalloweenConfig(raw: unknown): HalloweenConfig {
  const base = structuredClone(DEFAULT_HALLOWEEN_CONFIG);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as { boxOpening?: unknown; ids?: unknown; counts?: unknown; boxes?: unknown };
  if (r.boxOpening && typeof r.boxOpening === 'object') {
    const out: Record<string, HalloweenOpening> = {};
    for (const [year, data] of Object.entries(r.boxOpening as Record<string, unknown>)) {
      if (!/^\d{4}$/.test(year)) continue;
      const parsed = asYear(data);
      if (parsed) out[year] = parsed;
    }
    if (Object.keys(out).length) return { boxOpening: out };
  }
  const flat = asYear(r);
  if (flat?.ids.length) {
    return { boxOpening: { '2025': flat, '2026': { ...EMPTY_YEAR } } };
  }
  return base;
}

export function validateHalloweenConfig(cfg: HalloweenConfig): string | null {
  const years = Object.keys(cfg.boxOpening ?? {});
  if (!years.length) return 'boxOpening vacío';
  for (const year of years) {
    const data = cfg.boxOpening[year];
    if (!data.ids.length && !data.boxes) continue;
    if (!data.boxes || data.boxes < 1) return `${year}: boxes inválido`;
    if (data.ids.length !== data.counts.length) return `${year}: ids/counts no coinciden`;
  }
  return null;
}
