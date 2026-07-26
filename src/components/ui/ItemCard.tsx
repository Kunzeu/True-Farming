'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { GW2Item, GW2Price } from '@/types/gw2';
import { formatPrice } from '@/lib/gw2-api';
import WikiItemLink from '@/components/ui/WikiItemLink';

interface ItemCardProps {
  item: GW2Item;
  price?: GW2Price;
  showPrice?: boolean;
  onClick?: () => void;
}

const ItemCard = ({ item, price, showPrice = true, onClick }: ItemCardProps) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 'text-gray-300';
      case 'fine':
        return 'text-blue-300';
      case 'masterwork':
        return 'text-blue-400';
      case 'rare':
        return 'text-blue-500';
      case 'exotic':
        return 'text-blue-600';
      case 'ascended':
        return 'text-blue-700';
      case 'legendary':
        return 'text-blue-800';
      default:
        return 'text-gray-300';
    }
  };

  const getRarityBgColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 'bg-gray-700';
      case 'fine':
        return 'bg-blue-900/30';
      case 'masterwork':
        return 'bg-blue-900/30';
      case 'rare':
        return 'bg-blue-900/30';
      case 'exotic':
        return 'bg-blue-900/30';
      case 'ascended':
        return 'bg-blue-900/30';
      case 'legendary':
        return 'bg-blue-900/30';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Rarity indicator */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getRarityBgColor(item.rarity)}`} />
      
      {/* Item icon placeholder */}
      <div className="w-16 h-16 bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
        {item.icon ? (
          <Image 
            src={item.icon} 
            alt={item.name}
            width={48}
            height={48}
            className="w-12 h-12 object-contain"
          />
        ) : (
          <span className="text-gray-400 text-xs">Icon</span>
        )}
      </div>

      {/* Item name */}
      <h3 className={`font-semibold text-sm mb-1 ${getRarityColor(item.rarity)}`}>
        <WikiItemLink name={item.name} itemId={item.id} chatLink={item.chat_link} className="hover:underline">
          {item.name}
        </WikiItemLink>
      </h3>

      {/* Item type and level */}
      <div className="text-xs text-gray-400 mb-2">
        <span className="capitalize">{item.type}</span>
        {item.level > 0 && (
          <span className="ml-2">Nivel {item.level}</span>
        )}
      </div>

      {/* Price information */}
      {showPrice && price && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Compra:</span>
            <span className="text-green-400">
              {formatPrice(price.buys.unit_price)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Venta:</span>
            <span className="text-red-400">
              {formatPrice(price.sells.unit_price)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Cantidad:</span>
            <span className="text-blue-400">
              {price.sells.quantity.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Vendor value */}
      {item.vendor_value > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Vendedor:</span>
            <span className="text-yellow-400">
              {formatPrice(item.vendor_value)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ItemCard; 