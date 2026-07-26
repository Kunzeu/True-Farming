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

    // Check API key on mount/user change
    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const refresh = useCallback(async () => {
        if (!user?.id) return;

        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setLoading(true);
        setStatus('Iniciando conexión segura con GW2...');
        setError(null);
        setProgress(0);
        // No vaciar el mapa aquí: si no, el descuento desaparece durante el fetch
        // y el coste total “salta” como si estuviera roto.

        try {
            // Get API Key
            const tokenRes = await fetch(`/api/gw2/token?user_id=${user.id}`, { signal });
            if (!tokenRes.ok) throw new Error('No se pudo obtener la autorización de GW2');
            const { apiKey } = await tokenRes.json();

            if (!apiKey) {
                throw new Error('API Key no encontrada');
            }

            const GW2_API_BASE = 'https://api.guildwars2.com/v2';

            setStatus('Cargando materiales del banco...');

            // Initial fetch of account wide items
            const [materialsRes, bankRes, sharedRes, walletRes] = await Promise.all([
                fetch(`${GW2_API_BASE}/account/materials?access_token=${apiKey}`, { signal }),
                fetch(`${GW2_API_BASE}/account/bank?access_token=${apiKey}`, { signal }),
                fetch(`${GW2_API_BASE}/account/inventory?access_token=${apiKey}`, { signal }),
                fetch(`${GW2_API_BASE}/account/wallet?access_token=${apiKey}`, { signal })
            ]);

            if (signal.aborted) return;

            const newInventoryMap: InventoryMap = {};

            if (walletRes.ok) {
                const wallet = await walletRes.json();
                if (Array.isArray(wallet)) {
                    const newWalletMap: WalletMap = {};
                    for (const c of wallet) {
                        if (c && c.id != null) newWalletMap[c.id] = c.value ?? 0;
                    }
                    setWalletMap(newWalletMap);
                }
            }

            const addItems = (items: any[]) => {
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        if (item && item.id) {
                            newInventoryMap[item.id] = (newInventoryMap[item.id] || 0) + item.count;
                        }
                    });
                }
            };

            if (materialsRes.ok) addItems(await materialsRes.json());
            if (bankRes.ok) addItems(await bankRes.json());
            if (sharedRes.ok) addItems(await sharedRes.json());

            setStatus('Obteniendo lista de personajes...');

            // Fetch Characters
            const charsRes = await fetch(`${GW2_API_BASE}/characters?access_token=${apiKey}`, { signal });

            if (charsRes.ok) {
                const characters: string[] = await charsRes.json();
                // La API de GW2 tolera ~300 req/min; 15 en paralelo + pausa corta va sobrado
                const BATCH_SIZE = 15;
                let processed = 0;

                for (let i = 0; i < characters.length; i += BATCH_SIZE) {
                    if (signal.aborted) break;

                    const batch = characters.slice(i, i + BATCH_SIZE);
                    const batchPromises = batch.map(async (charName) => {
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
                            const fetchSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

                            try {
                                const res = await fetch(
                                    `${GW2_API_BASE}/characters/${encodeURIComponent(charName)}/inventory?access_token=${apiKey}`,
                                    { signal: fetchSignal }
                                );
                                clearTimeout(timeoutId);
                                if (!res.ok) return null;
                                return res.json();
                            } catch (error) {
                                clearTimeout(timeoutId);
                                throw error;
                            }
                        } catch (e) { return null; }
                    });

                    const results = await Promise.all(batchPromises);

                    results.forEach(charInventory => {
                        if (charInventory?.bags) {
                            charInventory.bags.forEach((bag: any) => {
                                bag?.inventory?.forEach((item: any) => {
                                    if (item?.id) {
                                        newInventoryMap[item.id] = (newInventoryMap[item.id] || 0) + item.count;
                                    }
                                });
                            });
                        }
                    });

                    processed += batch.length;
                    setProgress((processed / characters.length) * 100);
                    setStatus(`Inventario: ${processed}/${characters.length} personajes…`);

                    // Pausa breve solo si quedan más tandas (evita rate limit sin dormir de más)
                    if (i + BATCH_SIZE < characters.length) {
                        await new Promise(r => setTimeout(r, 250));
                    }
                }
            }

            if (signal.aborted) return;

            // Un solo commit: evita que el descuento “salte” a medias (banco sin bolsas)
            setInventoryMap({ ...newInventoryMap });
            setStatus('Completado');
            setLastUpdate(new Date());
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Error fetching materials:', err);
            setError(err instanceof Error ? err.message : 'Error de conexión');
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
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
