'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Package, 
  MapPin,
  Calendar,
  Star,
  Info,
  Wrench,
  FileText
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

interface GlossaryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  tips?: string[];
}

export default function GlossaryPage() {
  usePageTitle('pageTitles.glossary', 'Glossary');
  const { t, lang } = useI18n();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [kitNames, setKitNames] = useState<{[key: string]: string}>({});

  // Función para obtener los nombres de los kits desde la API
  useEffect(() => {
    const fetchKitNames = async () => {
      try {
        const apiLang = lang === 'es' ? 'es' : lang === 'de' ? 'de' : lang === 'fr' ? 'fr' : 'en';
        
        // IDs de los kits: 44602 (Copper-Fed), 89409 (Runecrafter's), 67027 (Silver-Fed)
        const kitIds = ['44602', '89409', '67027'];
        const kitIdsString = kitIds.join(',');
        
        const response = await fetch(`https://api.guildwars2.com/v2/items?ids=${kitIdsString}&lang=${apiLang}`, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });
        const itemsData = await response.json();
        
        const names: {[key: string]: string} = {};
        itemsData.forEach((item: { id: number; name: string }) => {
          if (item.id === 44602) {
            names.copperFed = item.name;
          }
          if (item.id === 89409) {
            names.runecrafters = item.name;
          }
          if (item.id === 67027) {
            names.silverFed = item.name;
          }
        });
        setKitNames(names);
      } catch (error) {
        console.error('Error fetching kit names:', error);
        // Fallback vacío si hay error
        setKitNames({});
      }
    };

    fetchKitNames();
  }, [lang]);

  const glossaryItems: GlossaryItem[] = useMemo(() => [
    // SALVAGING
    {
      id: 'salvaging',
      title: t('glossary.items.salvaging.title', 'Salvaging'),
      description: t('glossary.items.salvaging.description', 'Salvaging is the process of recycling equipment to obtain materials. It is one of the most profitable ways to earn gold in Guild Wars 2, especially with certain types of items.'),
      category: 'salvaging',
      icon: <Package className="h-6 w-6" />,
      color: 'blue',
      bgGradient: 'from-blue-500/20 to-blue-600/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      tips: [
        t('glossary.items.salvaging.tips.tip1', 'Research prices before salvaging'),
        t('glossary.items.salvaging.tips.tip2', 'Consider the full item value'),
        t('glossary.items.salvaging.tips.tip3', 'Use the appropriate kit for each type')
      ],

    },
    {
      id: 'salvage-kits',
      title: t('glossary.items.salvageKits.title', 'Salvage Kits'),
      description: t('glossary.items.salvageKits.description', 'Specialized tools for recycling equipment. Each kit has different success rates and associated costs. Automatic kits are more convenient but more expensive.'),
      category: 'salvaging',
      icon: <Wrench className="h-6 w-6" />,
      color: 'green',
      bgGradient: 'from-green-500/20 to-green-600/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
              tips: [
          t('glossary.items.salvageKits.tips.tip1', '{kitName}: For common and cheap items').replace('{kitName}', kitNames.copperFed || ''),
          t('glossary.items.salvageKits.tips.tip2', '{kitName}: For masterwork items with runes').replace('{kitName}', kitNames.runecrafters || ''),
          t('glossary.items.salvageKits.tips.tip3', '{kitName}: For rare and exotic items').replace('{kitName}', kitNames.silverFed || '')
        ]
    },
    {
      id: 'luck-calculator',
      title: t('glossary.items.luckCalculator.title', 'Luck Calculator'),
      description: t('glossary.items.luckCalculator.description', 'Calculator to determine the cost per luck points obtained when salvaging items. Helps optimize which items to salvage to maximize luck gain efficiency.'),
      category: 'salvaging',
      icon: <Star className="h-6 w-6" />,
      color: 'yellow',
      bgGradient: 'from-yellow-500/20 to-yellow-600/20',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400'
    },
    {
      id: 'research-notes',
      title: t('glossary.items.researchNotes.title', 'Research Notes'),
      description: t('glossary.items.researchNotes.description', 'Research notes obtained by salvaging specific items. They are necessary for advanced crafting and can be a significant source of income.'),
      category: 'salvaging',
      icon: <FileText className="h-6 w-6" />,
      color: 'green',
      bgGradient: 'from-green-500/20 to-green-600/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400'
    },

    // FARMING
    {
      id: 'farming-routes',
      title: t('glossary.items.farmingRoutes.title', 'Farming Routes'),
      description: t('glossary.items.farmingRoutes.description', 'Optimized routes for collecting materials and earning gold efficiently. Each route has different requirements, difficulty and expected earnings per hour.'),
      category: 'farming',
      icon: <MapPin className="h-6 w-6" />,
      color: 'green',
      bgGradient: 'from-green-500/20 to-green-600/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      tips: [
        t('glossary.items.farmingRoutes.tips.tip1', 'Optimized routes to maximize gold per hour'),
        t('glossary.items.farmingRoutes.tips.tip2', 'Plan your sessions according to events and daily goals'),
        t('glossary.items.farmingRoutes.tips.tip3', 'Different types of content for all tastes')
      ]
    },

    // FESTIVALS
    {
      id: 'festivals',
      title: t('glossary.items.festivals.title', 'Festivals'),
      description: t('glossary.items.festivals.description', 'Temporary events that offer unique content and special rewards. They are excellent opportunities to earn gold and exclusive items.'),
      category: 'festivals',
      icon: <Calendar className="h-6 w-6" />,
      color: 'purple',
      bgGradient: 'from-purple-500/20 to-purple-600/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
      tips: [
        t('glossary.items.festivals.tips.tip1', 'Sell specific items when their prices reach peaks'),
        t('glossary.items.festivals.tips.tip2', 'Participate in unique festival activities')
      ]
    },
  ], [t, kitNames]);

  const categories = [
    { id: 'all', name: t('glossary.categories.all', 'All'), icon: <BookOpen className="h-4 w-4" /> },
    { id: 'salvaging', name: t('glossary.categories.salvaging', 'Salvaging'), icon: <Package className="h-4 w-4" /> },
    { id: 'farming', name: t('glossary.categories.farming', 'Farming'), icon: <MapPin className="h-4 w-4" /> },
    { id: 'festivals', name: t('glossary.categories.festivals', 'Festivals'), icon: <Calendar className="h-4 w-4" /> }
  ];

  const filteredItems = glossaryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('glossary.title', 'GW2 Glossary')}
          </h1>
          <p className="text-xl text-gray-300">
            {t('glossary.subtitle', 'Complete guide of important concepts and terms for earning gold in Guild Wars 2')}
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t('glossary.search.placeholder', 'Search concepts...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Glossary Items Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { duration: 0.1 }
              }}
              className={`bg-gray-800 rounded-lg p-6 border ${item.borderColor} hover:shadow-2xl hover:shadow-blue-500/20 hover:border-opacity-100 group-hover:border-opacity-100 transition-all duration-300 cursor-pointer group relative overflow-hidden`}
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
              
              {/* Content wrapper */}
              <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <motion.div 
                  className={`p-2 rounded-lg bg-gradient-to-br ${item.bgGradient}`}
                  whileHover={{ 
                    rotate: 360,
                    scale: 1.1,
                    transition: { duration: 0.3 }
                  }}
                >
                  {item.icon}
                </motion.div>
                <h3 className={`text-xl font-semibold ${item.textColor} group-hover:scale-105 transition-transform duration-200`}>
                  {item.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-4 leading-relaxed">
                {item.description}
              </p>

              {/* Tips */}
              {item.tips && item.tips.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    {t('glossary.sections.tips', 'Tips')}
                  </h4>
                  <ul className="space-y-1">
                    {item.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="text-sm text-gray-300 flex items-start space-x-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Info className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {t('glossary.noResults.title', 'No results found')}
            </h3>
            <p className="text-gray-500">
              {t('glossary.noResults.description', 'Try adjusting your search terms or category filter')}
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
} 