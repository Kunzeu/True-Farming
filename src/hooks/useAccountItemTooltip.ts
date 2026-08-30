'use client';

import { useCallback, useRef, useState } from 'react';
import type {
  AccountItemDetails,
  AccountItemPrice,
  AccountTooltipData,
  AccountTooltipItem,
} from '@/lib/account-item-tooltip';

export function useAccountItemTooltip(lang: string) {
  const [hovered, setHovered] = useState<AccountTooltipData | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [itemCache, setItemCache] = useState<
    Map<number, { details: AccountItemDetails; price?: AccountItemPrice }>
  >(new Map());
  const itemCacheRef = useRef(itemCache);
  itemCacheRef.current = itemCache;
  const loadingRef = useRef(false);
  const hoveredIdRef = useRef<number | null>(null);

  const handleHover = useCallback(
    async (item: AccountTooltipItem, event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setPosition({ x: rect.right + 8, y: rect.top });

      const cached = itemCacheRef.current.get(item.id);
      if (cached) {
        hoveredIdRef.current = item.id;
        setHovered({ item, details: cached.details, price: cached.price });
        return;
      }

      if (loadingRef.current && hoveredIdRef.current === item.id) return;

      loadingRef.current = true;
      hoveredIdRef.current = item.id;
      setHovered(null);

      try {
        const detailsResponse = await fetch(
          `https://api.guildwars2.com/v2/items/${item.id}?lang=${lang}`,
        );
        const details: AccountItemDetails = await detailsResponse.json();

        let price: AccountItemPrice | undefined;
        try {
          const priceResponse = await fetch(
            `https://api.guildwars2.com/v2/commerce/prices/${item.id}`,
          );
          price = await priceResponse.json();
        } catch {
          price = undefined;
        }

        setItemCache((prev) => new Map(prev).set(item.id, { details, price }));
        setHovered({ item, details, price });
      } catch {
        try {
          const detailsResponse = await fetch(
            `https://api.guildwars2.com/v2/items/${item.id}?lang=${lang}`,
          );
          const details: AccountItemDetails = await detailsResponse.json();
          setItemCache((prev) => new Map(prev).set(item.id, { details }));
          setHovered({ item, details });
        } catch {
          // ignore
        }
      } finally {
        loadingRef.current = false;
      }
    },
    [lang],
  );

  const handleLeave = useCallback(() => {
    hoveredIdRef.current = null;
    setHovered(null);
  }, []);

  return { hovered, position, handleHover, handleLeave, itemCache };
}
