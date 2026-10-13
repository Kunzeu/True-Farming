'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import {
  DEFAULT_HALLOWEEN_CONFIG,
  mergeOpeningCsv,
  parseBoxOpeningCsv,
  type HalloweenConfig,
} from '@/lib/halloween-config';

type Props = {
  config: HalloweenConfig;
  onSaved: (config: HalloweenConfig) => void;
  token: string | null;
  userId: string | null;
};

export default function HalloweenConfigEditor({ config, onSaved, token, userId }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<HalloweenConfig>(() => structuredClone(config));
  const [year, setYear] = useState(() => Object.keys(config.boxOpening).sort().at(-1) || '2026');
  const [newYear, setNewYear] = useState('');
  const [csv, setCsv] = useState('');
  const [mergeCsv, setMergeCsv] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const revertTo = useRef(structuredClone(config));
  const yearData = draft.boxOpening[year];

  const readJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(t('fourWinds.edit.apiHtml'));
    }
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/festivals/halloween/config');
        if (!res.ok || cancelled) return;
        const data = await readJson(res);
        if (!cancelled) setHasBackup(!!data.hasBackup);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [open]);

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
    const applied = { ...next, boxes: next.boxes || yearData?.boxes || 0 };
    const nextDraft: HalloweenConfig = {
      ...draft,
      boxOpening: { ...draft.boxOpening, [year]: applied },
    };
    setDraft(nextDraft);
    onSaved(nextDraft);
    setStatus(
      t('fourWinds.edit.csvApplied')
        .replace('{year}', year)
        .replace('{items}', String(applied.ids.length))
        .replace('{boxes}', applied.boxes.toLocaleString())
    );
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
      const res = await fetch('/api/festivals/halloween/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ config: draft, userId }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setStatus([data.error || t('fourWinds.edit.saveError'), data.details].filter(Boolean).join(' — '));
        return;
      }
      setDraft(data.config);
      revertTo.current = structuredClone(data.config);
      onSaved(data.config);
      setHasBackup(!!data.hasBackup);
      setStatus(t('fourWinds.edit.saved'));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const restoreBackup = async () => {
    if (!token && !userId) {
      setStatus(t('fourWinds.edit.noSession'));
      return;
    }
    if (!confirm(t('fourWinds.edit.restoreConfirm'))) return;
    setRestoring(true);
    setStatus(null);
    try {
      const res = await fetch('/api/festivals/halloween/config', {
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
      revertTo.current = structuredClone(data.config);
      onSaved(data.config);
      setHasBackup(!!data.hasBackup);
      setStatus(t('fourWinds.edit.restored'));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setRestoring(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          revertTo.current = structuredClone(config);
          setDraft(structuredClone(config));
          setOpen(true);
        }}
        className="w-full mb-4 px-4 py-2 bg-orange-700/80 hover:bg-orange-600/80 text-white rounded-lg border border-orange-500/50 text-sm font-semibold"
      >
        {t('halloween.edit.open', 'Editar datos Halloween (mod/admin)')}
      </button>
    );
  }

  return (
    <div className="mb-4 bg-orange-950/40 border border-orange-500/40 rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-orange-200 font-bold">{t('halloween.edit.title', 'Editar Halloween')}</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-300 text-sm hover:text-white">
          {t('common.close')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm text-gray-300">
          {t('fourWinds.edit.year')}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="block mt-1 px-2 py-1.5 bg-gray-800 border border-orange-500/30 rounded text-white"
          >
            {Object.keys(draft.boxOpening).sort().map((y) => (
              <option key={y} value={y}>{y}</option>
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
              className="w-24 px-2 py-1.5 bg-gray-800 border border-orange-500/30 rounded text-white"
            />
            <button type="button" onClick={addYear} className="px-2 py-1.5 bg-gray-700 rounded text-white text-sm">+</button>
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
            className="block mt-1 w-36 px-2 py-1.5 bg-gray-800 border border-orange-500/30 rounded text-white font-mono"
          />
        </label>
      </div>
      <p className="text-xs text-gray-400">{t('fourWinds.edit.csvSteps')}</p>
      <p className="text-xs text-gray-400">
        {t('fourWinds.edit.itemsCount').replace('{count}', String(yearData?.ids.length ?? 0))}
      </p>
      <label className="block text-sm text-gray-300">
        {t('fourWinds.edit.pasteCsv')}
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          className="mt-1 block text-xs text-gray-300 file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-orange-700 file:text-white"
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
          className="mt-1 w-full px-2 py-1.5 bg-gray-900 border border-orange-500/30 rounded text-white font-mono text-xs"
          placeholder="item_id,item_name,item_amount,..."
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" checked={mergeCsv} onChange={(e) => setMergeCsv(e.target.checked)} />
        {t('fourWinds.edit.mergeCsv')}
      </label>
      <button type="button" onClick={applyCsv} className="px-3 py-1.5 bg-orange-700/80 hover:bg-orange-600/80 text-white rounded text-sm">
        {t('fourWinds.edit.applyCsv')}
      </button>
      <div className="flex flex-wrap gap-2 pt-2 border-t border-orange-500/20">
        <button type="button" onClick={save} disabled={saving} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white rounded font-semibold text-sm">
          {saving ? t('fourWinds.edit.saving') : t('fourWinds.edit.save')}
        </button>
        <button
          type="button"
          onClick={() => {
            const next = structuredClone(DEFAULT_HALLOWEEN_CONFIG);
            setDraft(next);
            onSaved(next);
            setStatus(t('fourWinds.edit.defaultsLoaded'));
          }}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          {t('fourWinds.edit.loadDefaults')}
        </button>
        <button
          type="button"
          onClick={restoreBackup}
          disabled={restoring || !hasBackup}
          className="px-3 py-2 bg-orange-800/80 hover:bg-orange-700/80 disabled:bg-gray-600 disabled:opacity-50 text-white rounded text-sm"
        >
          {restoring ? t('fourWinds.edit.restoring') : t('fourWinds.edit.restoreBackup')}
        </button>
      </div>
      {status && <p className="text-sm text-orange-200">{status}</p>}
    </div>
  );
}
