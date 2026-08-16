import { useState, useCallback, useRef, useEffect } from 'react';
import { User } from '@/types/auth'; // Correct import path

interface UseGW2InventoryProps {
    user: User | null;
}

interface InventoryMap {
    [key: number]: number;
}

/** Saldo por id de moneda (karma, esquirlas de espíritu…). */
interface WalletMap {
    [currencyId: number]: number;
}

interface UseGW2InventoryResult {
    inventoryMap: InventoryMap;
    walletMap: WalletMap;
    loading: boolean;
    error: string | null;
    status: string;
    refresh: () => Promise<void>;
    progress: number;
    hasApiKey: boolean;
    checkApiKey: () => Promise<void>;
    lastUpdate: Date | null;
}

type InvCache = { inventory: InventoryMap; wallet: WalletMap; ts: number };

function cacheKey(userId: string) {
    return `tf-gw2-inv-${userId}`;
}

function readCache(userId: string): InvCache | null {
    try {
        const raw = localStorage.getItem(cacheKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as InvCache;
        if (!parsed?.inventory || !parsed.ts) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeCache(userId: string, data: InvCache) {
    try {
        localStorage.setItem(cacheKey(userId), JSON.stringify(data));
    } catch {
        /* quota */
    }
}

function addItems(map: InventoryMap, items: unknown) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
        if (item && typeof item === 'object' && 'id' in item && 'count' in item) {
            const id = Number((item as { id: number }).id);
            const count = Number((item as { count: number }).count);
            if (id && count) map[id] = (map[id] || 0) + count;
        }
    }
}

function addBags(map: InventoryMap, bags: { inventory?: unknown[] }[] | null | undefined) {
    if (!bags) return;
    for (const bag of bags) {
        addItems(map, bag?.inventory);
    }
}

export function useGW2Inventory({ user }: UseGW2InventoryProps): UseGW2InventoryResult {
    const [inventoryMap, setInventoryMap] = useState<InventoryMap>({});
    const [walletMap, setWalletMap] = useState<WalletMap>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const inventoryMapRef = useRef(inventoryMap);
    inventoryMapRef.current = inventoryMap;

    const checkApiKey = useCallback(async () => {
        if (!user?.id) return;
        try {
            const response = await fetch(`/api/users/${user.id}/summary`);
            if (response.ok) {
                const data = await response.json();
                setHasApiKey(!!data.hasApiKey);
            }
        } catch (error) {
            console.error('Error checking API key:', error);
        }
    }, [user?.id]);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    // ponytail: pintar cantidades cacheadas al instante; el refresh pisa solo counts
    useEffect(() => {
        if (!user?.id) return;
        const cached = readCache(user.id);
        if (!cached) return;
        setInventoryMap(cached.inventory);
        setWalletMap(cached.wallet ?? {});
        setLastUpdate(new Date(cached.ts));
    }, [user?.id]);

    const refresh = useCallback(async () => {
        if (!user?.id) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const hasCache = Object.keys(inventoryMapRef.current).length > 0;
        if (!hasCache) setLoading(true);
        setStatus('Iniciando conexión segura con GW2...');
        setError(null);
        setProgress(hasCache ? 40 : 0);

        try {
            const tokenRes = await fetch(`/api/gw2/token?user_id=${user.id}`, { signal });
            if (!tokenRes.ok) throw new Error('No se pudo obtener la autorización de GW2');
            const { apiKey } = await tokenRes.json();
            if (!apiKey) throw new Error('API Key no encontrada');

            const GW2_API_BASE = 'https://api.guildwars2.com/v2';
            const auth = `access_token=${apiKey}`;

            setStatus('Cargando cantidades…');

            const [materialsRes, bankRes, sharedRes, walletRes, allCharsRes] = await Promise.all([
                fetch(`${GW2_API_BASE}/account/materials?${auth}`, { signal }),
                fetch(`${GW2_API_BASE}/account/bank?${auth}`, { signal }),
                fetch(`${GW2_API_BASE}/account/inventory?${auth}`, { signal }),
                fetch(`${GW2_API_BASE}/account/wallet?${auth}`, { signal }),
                fetch(`${GW2_API_BASE}/characters?ids=all&${auth}`, { signal }),
            ]);

            if (signal.aborted) return;

            const newInventoryMap: InventoryMap = {};
            let nextWallet: WalletMap = {};

            if (walletRes.ok) {
                const wallet = await walletRes.json();
                if (Array.isArray(wallet)) {
                    for (const c of wallet) {
                        if (c && c.id != null) nextWallet[c.id] = c.value ?? 0;
                    }
                    setWalletMap(nextWallet);
                }
            }

            if (materialsRes.ok) addItems(newInventoryMap, await materialsRes.json());
            if (bankRes.ok) addItems(newInventoryMap, await bankRes.json());
            if (sharedRes.ok) addItems(newInventoryMap, await sharedRes.json());

            let gotChars = false;
            if (allCharsRes.ok) {
                const characters = await allCharsRes.json();
                if (Array.isArray(characters)) {
                    gotChars = true;
                    for (const ch of characters) addBags(newInventoryMap, ch?.bags);
                    setProgress(100);
                    setStatus(`Inventario: ${characters.length} personajes`);
                }
            }

            if (!gotChars) {
                setStatus('Obteniendo lista de personajes...');
                const charsRes = await fetch(`${GW2_API_BASE}/characters?${auth}`, { signal });
                if (charsRes.ok) {
                    const characters: string[] = await charsRes.json();
                    const BATCH_SIZE = 20;
                    let processed = 0;
                    for (let i = 0; i < characters.length; i += BATCH_SIZE) {
                        if (signal.aborted) break;
                        const batch = characters.slice(i, i + BATCH_SIZE);
                        const results = await Promise.all(
                            batch.map(async (charName) => {
                                try {
                                    const res = await fetch(
                                        `${GW2_API_BASE}/characters/${encodeURIComponent(charName)}/inventory?${auth}`,
                                        { signal }
                                    );
                                    if (!res.ok) return null;
                                    return res.json();
                                } catch {
                                    return null;
                                }
                            })
                        );
                        for (const charInventory of results) {
                            addBags(newInventoryMap, charInventory?.bags);
                        }
                        processed += batch.length;
                        setProgress((processed / characters.length) * 100);
                        setStatus(`Inventario: ${processed}/${characters.length} personajes…`);
                    }
                }
            }

            if (signal.aborted) return;

            setInventoryMap({ ...newInventoryMap });
            writeCache(user.id, {
                inventory: newInventoryMap,
                wallet: nextWallet,
                ts: Date.now(),
            });
            setStatus('Completado');
            setLastUpdate(new Date());
        } catch (err: unknown) {
            const e = err as { name?: string };
            if (e?.name === 'AbortError') return;
            console.error('Error fetching materials:', err);
            setError(err instanceof Error ? err.message : 'Error de conexión');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [user?.id]);

    return {
        inventoryMap,
        walletMap,
        loading,
        error,
        status,
        refresh,
        progress,
        hasApiKey,
        checkApiKey,
        lastUpdate
    };
}
