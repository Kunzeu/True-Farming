'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/contexts/I18nContext';
import {
  DEFAULT_FOUR_WINDS_CONFIG,
  mergeOpeningCsv,
  parseBoxOpeningCsv,
  type FourWindsConfig,
} from '@/lib/four-winds-config';

type Props = {
  config: FourWindsConfig;
  onSaved: (config: FourWindsConfig) => void;
  token: string | null;
  userId: string | null;
};

type Tab = 'opening' | 'calculator' | 'tomes';

type Gw2ItemLite = { id: number; name: string; icon?: string };

export default function FourWindsConfigEditor({ config, onSaved, token, userId }: Props) {
  const { lang, t } = useI18n();
  const tr = (key: string, vars?: Record<string, string | number>) => {
    let out = t(key);
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.split('{' + k + '}').join(String(v));
    return out;
  };
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('opening');
  const [draft, setDraft] = useState<FourWindsConfig>(() => structuredClone(config));
  const [year, setYear] = useState(() => Object.keys(config.boxOpening).sort().at(-1) || '2026');
  const [csv, setCsv] = useState('');
  const [mergeCsv, setMergeCsv] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [displayNames, setDisplayNames] = useState<Record<number, string>>({});
  const [icons, setIcons] = useState<Record<number, string>>({});
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  // ponytail: ID en string local hasta Enter/blur
  const [idDrafts, setIdDrafts] = useState<Record<number, string>>({});

  const yearData = draft.boxOpening[year];

  const readJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(t('fourWinds.edit.apiHtml'));
    }
  };

  const resolveItemName = useCallback(async (idx: number, id: number) => {
    if (!id || id < 1) return;
    setResolvingId(id);
    try {
      const [langRes, enRes] = await Promise.all([
        fetch(`https://api.guildwars2.com/v2/items/${id}?lang=${lang}`),
        lang === 'en'
          ? Promise.resolve(null)
          : fetch(`https://api.guildwars2.com/v2/items/${id}?lang=en`),
      ]);
      if (!langRes.ok) {
        setDisplayNames((prev) => ({ ...prev, [id]: `ID ${id} ?` }));
        return;
      }
      const langData: Gw2ItemLite = await langRes.json();
      const enData: Gw2ItemLite =
        enRes && enRes.ok ? await enRes.json() : langData;
      setDisplayNames((prev) => ({ ...prev, [id]: langData.name || `ID ${id}` }));
      if (langData.icon) {
        setIcons((prev) => ({ ...prev, [id]: langData.icon! }));
      }
      setDraft((d) => {
        const boxCalculator = [...d.boxCalculator];
        if (!boxCalculator[idx] || boxCalculator[idx].id !== id) return d;
        boxCalculator[idx] = {
          ...boxCalculator[idx],
          name: enData.name || langData.name || boxCalculator[idx].name,
        };
        return { ...d, boxCalculator };
      });
    } catch {
      setDisplayNames((prev) => ({ ...prev, [id]: `ID ${id} ?` }));
    } finally {
      setResolvingId(null);
    }
  }, [lang]);

  const commitId = useCallback((idx: number) => {
    const raw = idDrafts[idx];
    const current = draft.boxCalculator[idx];
    if (!current) return;
    const id = raw !== undefined ? (parseInt(raw, 10) || 0) : current.id;
    setIdDrafts((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    if (id === current.id && current.name) {
      if (!displayNames[id] || !icons[id]) resolveItemName(idx, id);
      return;
    }
    setDraft((d) => {
      const boxCalculator = [...d.boxCalculator];
      boxCalculator[idx] = { ...boxCalculator[idx], id, name: '' };
      return { ...d, boxCalculator };
    });
    resolveItemName(idx, id);
  }, [idDrafts, draft.boxCalculator, displayNames, icons, resolveItemName]);

  const calcIdsKey = draft.boxCalculator.map((i) => i.id).join(',');

  useEffect(() => {
    if (!open || tab !== 'calculator') return;
    let cancelled = false;
    (async () => {
      const ids = [...new Set(calcIdsKey.split(',').map(Number).filter((id) => id > 0))];
      if (!ids.length) return;
      try {
        const res = await fetch(
          `https://api.guildwars2.com/v2/items?ids=${ids.join(',')}&lang=${lang}`
        );
        if (!res.ok || cancelled) return;
        const data: Gw2ItemLite[] = await res.json();
        if (cancelled) return;
        setDisplayNames((prev) => {
          const next = { ...prev };
          data.forEach((item) => { next[item.id] = item.name; });
          return next;
        });
        setIcons((prev) => {
          const next = { ...prev };
          data.forEach((item) => {
            if (item.icon) next[item.id] = item.icon;
          });
          return next;
        });
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [open, tab, lang, calcIdsKey]);

  const syncFromProp = () => {
    setDraft(structuredClone(config));
    setIdDrafts({});
    setStatus(null);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/festivals/four-winds/config');
        if (!res.ok || cancelled) return;
        const data = await readJson(res);
        if (!cancelled) setHasBackup(!!data.hasBackup);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const restoreBackup = async () => {
    if (!token && !userId) {
      setStatus(t('fourWinds.edit.noSession'));
      return;
    }
    if (!confirm(t('fourWinds.edit.restoreConfirm'))) return;
    setRestoring(true);
    setStatus(null);
    try {
      const res = await fetch('/api/festivals/four-winds/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ restoreBackup: true, userId }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setStatus([data.error || t('fourWinds.edit.restoreError'), data.details].filter(Boolean).join(' — '));
        return;
      }
      setDraft(data.config);
      setHasBackup(!!data.hasBackup);
      onSaved(data.config);
      setStatus(t('fourWinds.edit.restored'));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setRestoring(false);
    }
  };

  const applyCsv = () => {
    if (!csv.trim()) {
      setStatus(t('fourWinds.edit.csvEmpty'));
      return;
    }
    const parsed = parseBoxOpeningCsv(csv);
    if (!parsed.ids.length) {
      setStatus(t('fourWinds.edit.csvEmpty'));
      return;
    }
    const next = mergeCsv && yearData ? mergeOpeningCsv(yearData, csv) : parsed;
    const boxes = next.boxes || yearData?.boxes || 0;
    const applied = { ...next, boxes };
    setDraft((d) => ({
      ...d,
      boxOpening: { ...d.boxOpening, [year]: applied },
    }));
    setStatus(tr('fourWinds.edit.csvApplied', { year, items: applied.ids.length, boxes: applied.boxes.toLocaleString() }));
  };

  const addYear = () => {
    const y = newYear.trim();
    if (!/^\d{4}$/.test(y) || draft.boxOpening[y]) return;
    setDraft((d) => ({
      ...d,
      boxOpening: { ...d.boxOpening, [y]: { boxes: 0, ids: [], counts: [] } },
    }));
    setYear(y);
    setNewYear('');
  };

  const save = async () => {
    if (!token && !userId) {
      setStatus(t('fourWinds.edit.noSession'));
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const ids = [...new Set(draft.boxCalculator.map((i) => i.id).filter((id) => id > 0))];
      const nameEnById: Record<number, string> = {};
      if (ids.length) {
        const enRes = await fetch(
          `https://api.guildwars2.com/v2/items?ids=${ids.join(',')}&lang=en`
        );
        if (enRes.ok) {
          const enData: { id: number; name: string }[] = await enRes.json();
          enData.forEach((i) => { nameEnById[i.id] = i.name; });
        }
      }
      const configToSave: FourWindsConfig = {
        ...draft,
        boxCalculator: draft.boxCalculator.map((item) => ({
          ...item,
          name: nameEnById[item.id] || item.name || `Item ${item.id}`,
        })),
      };

      const res = await fetch('/api/festivals/four-winds/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ config: configToSave, userId }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setStatus([data.error || t('fourWinds.edit.saveError'), data.details].filter(Boolean).join(' — '));
        return;
      }
      setDraft(data.config);
      onSaved(data.config);
      setHasBackup(!!data.hasBackup);
      setStatus(t('fourWinds.edit.saved'));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setDraft(structuredClone(DEFAULT_FOUR_WINDS_CONFIG));
    setIdDrafts({});
    setStatus(t('fourWinds.edit.defaultsLoaded'));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          syncFromProp();
          setOpen(true);
        }}
        className="w-full mb-4 px-4 py-2 bg-amber-700/80 hover:bg-amber-600/80 text-white rounded-lg border border-amber-500/50 text-sm font-semibold"
      >
        {t('fourWinds.edit.open')}
      </button>
    );
  }

  return (
    <div className="mb-4 bg-amber-950/40 border border-amber-500/40 rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-amber-200 font-bold">{t('fourWinds.edit.title')}</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-300 text-sm hover:text-white">
          {t('common.close')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['opening', 'fourWinds.edit.tabOpening'],
          ['calculator', 'fourWinds.edit.tabCalculator'],
          ['tomes', 'fourWinds.edit.tabTomes'],
        ] as const).map(([id, labelKey]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1 rounded text-sm border ${
              tab === id
                ? 'bg-amber-600/80 border-amber-400 text-white'
                : 'bg-gray-800/60 border-amber-500/30 text-gray-300'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {tab === 'opening' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <label className="text-sm text-gray-300">
              {t('fourWinds.edit.year')}
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="block mt-1 px-2 py-1.5 bg-gray-800 border border-amber-500/30 rounded text-white"
              >
                {Object.keys(draft.boxOpening)
                  .sort()
                  .map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-sm text-gray-300">
              {t('fourWinds.edit.newYear')}
              <div className="flex gap-1 mt-1">
                <input
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="2027"
                  className="w-24 px-2 py-1.5 bg-gray-800 border border-amber-500/30 rounded text-white"
                />
                <button type="button" onClick={addYear} className="px-2 py-1.5 bg-gray-700 rounded text-white text-sm">
                  +
                </button>
              </div>
            </label>
            <label className="text-sm text-gray-300">
              {t('fourWinds.edit.boxesOpened')}
              <input
                type="number"
                min={0}
                value={yearData?.boxes ?? 0}
                onChange={(e) => {
                  const boxes = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setDraft((d) => ({
                    ...d,
                    boxOpening: {
                      ...d.boxOpening,
                      [year]: { ...(d.boxOpening[year] || { ids: [], counts: [] }), boxes },
                    },
                  }));
                }}
                className="block mt-1 w-36 px-2 py-1.5 bg-gray-800 border border-amber-500/30 rounded text-white font-mono"
              />
            </label>
          </div>
          <p className="text-xs text-gray-400">
            {t('fourWinds.edit.csvSteps')}
          </p>
          <p className="text-xs text-gray-400">
            {tr('fourWinds.edit.itemsCount', { count: yearData?.ids.length ?? 0 })}
            {yearData && yearData.ids.length !== yearData.counts.length ? (' ' + t('fourWinds.edit.idsMismatch')) : ''}
          </p>
          <label className="block text-sm text-gray-300">
            {t('fourWinds.edit.pasteCsv')}
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="mt-1 block text-xs text-gray-300 file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-cyan-700 file:text-white"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCsv(await file.text());
                e.target.value = '';
              }}
            />
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={5}
              className="mt-1 w-full px-2 py-1.5 bg-gray-900 border border-amber-500/30 rounded text-white font-mono text-xs"
              placeholder="item_id,item_name,item_amount,..."
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={mergeCsv} onChange={(e) => setMergeCsv(e.target.checked)} />
            {t('fourWinds.edit.mergeCsv')}
          </label>
          <button
            type="button"
            onClick={applyCsv}
            className="px-3 py-1.5 bg-cyan-700/80 hover:bg-cyan-600/80 text-white rounded text-sm"
          >
            {t('fourWinds.edit.applyCsv')}
          </button>
        </div>
      )}

      {tab === 'calculator' && (
        <div className="overflow-x-auto max-h-80 overflow-y-auto border border-amber-500/20 rounded">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-gray-300 text-left">
                <th className="p-2">{t('fourWinds.edit.colId')}</th>
                <th className="p-2">{t('fourWinds.edit.colItem')}</th>
                <th className="p-2">{t('fourWinds.table.numPerBox')}</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {draft.boxCalculator.map((item, idx) => (
                <tr key={`row-${idx}`} className="border-t border-amber-500/10">
                  <td className="p-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={idDrafts[idx] !== undefined ? idDrafts[idx] : (item.id ? String(item.id) : '')}
                      placeholder={t('fourWinds.edit.colId')}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '');
                        setIdDrafts((prev) => ({ ...prev, [idx]: v }));
                      }}
                      onBlur={() => commitId(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-28 px-1 py-1 bg-gray-800 border border-amber-500/20 rounded text-white font-mono"
                    />
                  </td>
                  <td className="p-1 text-gray-200 min-w-[12rem]">
                    <div className="flex items-center gap-2">
                      {icons[item.id] ? (
                        <Image
                          src={icons[item.id]}
                          alt=""
                          width={24}
                          height={24}
                          className="rounded border border-amber-500/30 shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-gray-800 border border-amber-500/20 shrink-0" />
                      )}
                      <span>
                        {resolvingId === item.id
                          ? '…'
                          : displayNames[item.id] || item.name || (
                              <span className="text-gray-500">{t('fourWinds.edit.idHint')}</span>
                            )}
                      </span>
                    </div>
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      step="any"
                      value={item.numPerBox}
                      onChange={(e) => {
                        const numPerBox = parseFloat(e.target.value) || 0;
                        setDraft((d) => {
                          const boxCalculator = [...d.boxCalculator];
                          boxCalculator[idx] = { ...boxCalculator[idx], numPerBox };
                          return { ...d, boxCalculator };
                        });
                      }}
                      className="w-24 px-1 py-1 bg-gray-800 border border-amber-500/20 rounded text-white font-mono"
                    />
                  </td>
                  <td className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIdDrafts({});
                        setDraft((d) => ({
                          ...d,
                          boxCalculator: d.boxCalculator.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="text-red-400 text-xs hover:text-red-300"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                boxCalculator: [
                  ...d.boxCalculator,
                  { id: 0, name: '', numPerBox: 1, pricePerUnit: 0 },
                ],
              }))
            }
            className="m-2 px-2 py-1 bg-gray-700 text-white rounded text-xs"
          >
            {t('fourWinds.edit.addItem')}
          </button>
        </div>
      )}

      {tab === 'tomes' && (
        <label className="text-sm text-gray-300 block">
          {t('fourWinds.edit.tokensPerTome')}
          <input
            type="number"
            min={1}
            value={draft.tokensPerTome}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                tokensPerTome: Math.max(1, parseInt(e.target.value, 10) || 1),
              }))
            }
            className="block mt-1 w-40 px-2 py-1.5 bg-gray-800 border border-amber-500/30 rounded text-white font-mono"
          />
        </label>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-500/20">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 text-white rounded font-semibold text-sm"
        >
          {saving ? t('fourWinds.edit.saving') : t('fourWinds.edit.save')}
        </button>
        <button
          type="button"
          onClick={resetDefaults}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          {t('fourWinds.edit.loadDefaults')}
        </button>
        <button
          type="button"
          onClick={syncFromProp}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          {t('fourWinds.edit.discard')}
        </button>
        <button
          type="button"
          onClick={restoreBackup}
          disabled={restoring || !hasBackup}
          className="px-3 py-2 bg-orange-800/80 hover:bg-orange-700/80 disabled:bg-gray-600 disabled:opacity-50 text-white rounded text-sm"
          title={!hasBackup ? t('fourWinds.edit.noBackup') : undefined}
        >
          {restoring ? t('fourWinds.edit.restoring') : t('fourWinds.edit.restoreBackup')}
        </button>
      </div>
      {status && <p className="text-sm text-amber-200">{status}</p>}
    </div>
  );
}
