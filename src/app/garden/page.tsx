'use client';

import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap,
  ArrowLeft,
  Coins,
  BookOpen,
  Info,
  Target,
  MapPin,
  CheckCircle,
  Hammer,
  Copy,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGW2Items } from '@/hooks/useGW2ItemCache';
import WikiTooltip from '@/components/ui/WikiTooltip';
import { GW2Item } from '@/types/gw2';

const JardinesPage = () => {
  const { t, lang } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('introduction');
  const [consortiumSickleData, setConsortiumSickleData] = useState<GW2Item | null>(null);
  const [unboundMiningData, setUnboundMiningData] = useState<GW2Item | null>(null);
  const [unboundLoggingData, setUnboundLoggingData] = useState<GW2Item | null>(null);
  const [alternativeSickleData, setAlternativeSickleData] = useState<GW2Item | null>(null);
  const [alternativeMSickleData, setAlternativeMSickleData] = useState<GW2Item | null>(null);
  const [volatileHarvestingSickleData, setVolatileHarvestingSickleData] = useState<GW2Item | null>(null);
  const [itemBoosterData, setItemBoosterData] = useState<GW2Item | null>(null);
  const [guildBannerData, setGuildBannerData] = useState<GW2Item | null>(null);
  const [xpBoosterData, setXpBoosterData] = useState<GW2Item | null>(null);
  const [candyGobblerData, setCandyGobblerData] = useState<GW2Item | null>(null);
  const [volatileMagicGlyphData, setVolatileMagicGlyphData] = useState<GW2Item | null>(null);
  const [copiedWaypoint, setCopiedWaypoint] = useState<string | null>(null);
  const [list1Copied, setList1Copied] = useState(false);
  const [list2Copied, setList2Copied] = useState(false);
  const [list3Copied, setList3Copied] = useState(false);
  const [mapData, setMapData] = useState<Record<number, { name: string, region_name: string }>>({});
  const [imageModal, setImageModal] = useState<{ isOpen: boolean, currentIndex: number, images: string[] }>({
    isOpen: false,
    currentIndex: 0,
    images: []
  });

  // Configurar título de la página
  usePageTitle(t('gardenPage.title'), t('gardenPage.title'));

  // Array con todas las imágenes de jardines para el modal (en orden de aparición en las cuadrículas)
  const gardenImages = [
    '/images/garden/test.png',                    // 1. Fields of Ruin
    '/images/garden/test2.png',                  // 2. Fireheart Rise
    '/images/garden/Tyria-3.webp',               // 3. Iron Marches
    '/images/garden/Tyria-4.webp',               // 4. Plains of Ashford
    '/images/garden/Tyria-5.webp',               // 5. Diessa Plateau
    '/images/garden/Tyria-6.webp',               // 6. Fireheart Rise
    '/images/garden/Tyria-7.webp',               // 7. Gendarran Fields
    '/images/garden/Tyria-8.webp',               // 8. Harathi Hinterlands
    '/images/garden/Tyria-9.webp',               // 9. Kessex Hills
    '/images/garden/Tyria-10.webp',              // 10. Lornar's Pass
    '/images/garden/Tyria-11.webp',              // 11. Bloodtide Coast
    '/images/garden/Tyria-12.webp',              // 12. Dredgehaunt Cliffs
    '/images/garden/Tyria-13.webp',              // 13. Frostgorge Sound
    '/images/garden/Tyria-14.webp',              // 14. Mount Maelstrom
    '/images/garden/Tyria-15.webp',              // 15. Sparkfly Fen
    '/images/garden/Tyria-16.webp',              // 16. Gendarran Fields
    '/images/garden/Tyria-17.webp',              // 17. Caledon Forest
    '/images/garden/Tyria-18.webp',              // 18. Metrica Province
    '/images/garden/Tyria-19.webp',              // 19. Kessex Hills
    '/images/garden/Tyria-20.webp',              // 20. Metrica Province
    '/images/garden/Tyria-21.webp',              // 21. Caledon Forest
    '/images/garden/Tyria-22-524x1024.webp',     // 22. Brisban Wildlands
    '/images/garden/Tyria-23.webp',              // 23. Dry Top
    '/images/garden/Tyria-24.webp',              // 24. Malchor's Leap
    '/images/garden/HoT-1.webp',                 // 25. Jaka Itzel
    '/images/garden/HoT-2-1024x802.webp',        // 26. Tangled Depths
    '/images/garden/LS4-2.webp',                 // 27. Domain of Kourna
    '/images/garden/LS3-1.webp',                 // 28. Ember Bay
    '/images/garden/LS3-2.webp',                 // 29. Draconis Mons
    '/images/garden/LS3-3-1024x425.webp',        // 30. Bitterfrost Frontier
    '/images/garden/POF-1.webp',                 // 31. The Desolation
    '/images/garden/POF-2-923x1024.webp',        // 32. Elon Riverlands
    '/images/garden/POF-3-1024x361.webp',        // 33. Elon Riverlands
    '/images/garden/POF-4-1-630x1024.webp',      // 34. Desert Highlands
    '/images/garden/PoF-5.webp',                 // 35. Crystal Oasis
    '/images/garden/LS4-1.webp',                 // 36. Sandswept Isles
    '/images/garden/LS5-1.webp',                 // 37. Grothmar Valley
    '/images/garden/LS5-3.webp',                 // 38. Bjora Marches
    '/images/garden/LS5-2.webp',                 // 39. Drizzlewood Coast
    '/images/garden/LS5-4.webp',                 // 40. Drizzlewood Coast
    '/images/garden/LS5-5.webp',                 // 41. Drizzlewood Coast
    '/images/garden/EoD-5.webp',                 // 42. Seitung
    '/images/garden/EoD-1-709x1024.webp',        // 43. New Kaineng City
    '/images/garden/EoD-2.webp',                 // 44. New Kaineng City
    '/images/garden/EoD-3.webp',                 // 45. New Kaineng City
    '/images/garden/EoD-4.webp',                 // 46. New Kaineng City
    '/images/garden/SOTO-1-1024x458.webp',       // 47. Skywatch Archipelago
    '/images/garden/SOTO-2-514x1024.webp',       // 48. Skywatch Archipelago
    '/images/garden/JW-1.png',                   // 49. The Echovald Wilds
    '/images/garden/JW-2.png',                   // 50. Lowland Shore
    '/images/garden/Lion-Arch.webp',             // 51. Lion's Arch
    '/images/garden/VoE.webp'                    // 52. Shipwreck Strand
  ];

  /** Chat codes en el mismo orden que `gardenImages` (para copiar en el modal ampliado). */
  const gardenWaypoints: string[] = [
    '[&BE8BAAA=]',
    '[&BAACAAA=]',
    '[&BOwBAAA=]',
    '[&BMcDAAA=]',
    '[&BN4AAAA=]',
    '[&BB0CAAA=]',
    '[&BHgCAAA=]',
    '[&BMAAAAA=]',
    '[&BOYAAAA=]',
    '[&BF8CAAA=]',
    '[&BFECAAA=]',
    '[&BNECAAA=]',
    '[&BFgGAAA=]',
    '[&BMkBAAA=]',
    '[&BKcBAAA=]',
    '[&BOQAAAA=]',
    '[&BKsAAAA=]',
    '[&BPoAAAA=]',
    '[&BBIAAAA=]',
    '[&BEIAAAA=]',
    '[&BEABAAA=]',
    '[&BFwAAAA=]',
    '[&BIYHAAA=]',
    '[&BKYCAAA=]',
    '[&BOAHAAA=]',
    '[&BA4IAAA=]',
    '[&BFcLAAA=]',
    '[&BF8JAAA=]',
    '[&BM0JAAA=]',
    '[&BH0JAAA=]',
    '[&BNwKAAA=]',
    '[&BCgKAAA=]',
    '[&BCgKAAA=]',
    '[&BJEKAAA=]',
    '[&BEAKAAA=]',
    '[&BEMLAAA=]',
    '[&BBsMAAA=]',
    '[&BCcMAAA=]',
    '[&BGQMAAA=]',
    '[&BGQMAAA=]',
    '[&BGQMAAA=]',
    '[&BJ4MAAA=]',
    '[&BBkNAAA=]',
    '[&BBkNAAA=]',
    '[&BCANAAA=]',
    '[&BNQMAAA=]',
    '[&BFUOAAA=]',
    '[&BNwNAAA=]',
    '[&BK4OAAA=]',
    '[&BK4OAAA=]',
    '[&BC4EAAA=]',
    '[&BJEPAAA=]'
  ];

  // Obtener datos de los items de la API con caché optimizado
  const itemIds = [42594, 80977, 80979, 102000, 67032, 20003, 39699, 20002, 67393, 87698, 85733];
  const { items: itemsData } = useGW2Items(itemIds, lang);

  // Mapear los resultados a los estados correspondientes cuando los datos estén disponibles
  useEffect(() => {
    if (!itemsData || Object.keys(itemsData).length === 0) return;

    Object.values(itemsData).forEach((item) => {
      // Usar el objeto completo, no solo nombre e icono
      const itemData = item;

      switch (item.id) {
        case 42594:
          setConsortiumSickleData(itemData);
          break;
        case 80977:
          setUnboundMiningData(itemData);
          break;
        case 80979:
          setUnboundLoggingData(itemData);
          break;
        case 102000:
          setAlternativeSickleData(itemData);
          break;
        case 67032:
          setAlternativeMSickleData(itemData);
          break;
        case 85733:
          setVolatileHarvestingSickleData(itemData);
          break;
        case 20003:
          setItemBoosterData(itemData);
          break;
        case 39699:
          setGuildBannerData(itemData);
          break;
        case 20002:
          setXpBoosterData(itemData);
          break;
        case 67393:
          setCandyGobblerData(itemData);
          break;
        case 87698:
          setVolatileMagicGlyphData(itemData);
          break;
      }
    });
  }, [itemsData]);

  // Obtener datos de los mapas de la API de GW2
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        // IDs de los mapas que usamos en la página
        const mapIds = [15, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 39, 50, 51, 53, 54, 73, 988, 1045, 1052, 1175, 1178, 1195, 1210, 1211, 1226, 1271, 1288, 1330, 1343, 1371, 1442, 1438, 1452, 1510, 1550]; // Todos los mapas de jardines

        const response = await fetch(`https://api.guildwars2.com/v2/maps?ids=${mapIds.join(',')}&lang=${lang}`, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });
        const maps = await response.json();

        const mapDataObj: Record<number, { name: string, region_name: string }> = {};
        maps.forEach((map: { id: number, name: string, region_name: string }) => {
          mapDataObj[map.id] = {
            name: map.name,
            region_name: map.region_name
          };
        });

        setMapData(mapDataObj);
      } catch (error) {
        console.error('Error fetching map data:', error);
      }
    };

    fetchMapData();
  }, [lang]);

  // Navegación suave con offset para el header
  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const headerOffset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // Actualizar inmediatamente la sección seleccionada
      setSelectedSection(sectionId);
      setMobileMenuOpen(false);

      // Hacer scroll suave
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  // Detectar sección activa basándose en el scroll
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const sections = ['introduction', 'gardenTypes', 'plants', 'waypoints', 'locations', 'rewards'];
          const headerOffset = 200;
          let currentSection = 'introduction';

          const scrollPosition = window.scrollY + headerOffset;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const scrollTop = window.scrollY;

          // Buscar la sección activa
          for (let i = sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(sections[i]);
            if (section && section.offsetTop <= scrollPosition) {
              currentSection = sections[i];
              break;
            }
          }

          // Detectión especial para la última sección (rewards)
          // Si estamos en el último 20% del documento, forzar rewards
          if (scrollTop + windowHeight >= documentHeight * 0.8) {
            const rewardsSection = document.getElementById('rewards');
            if (rewardsSection) {
              currentSection = 'rewards';
            }
          }

          // Solo actualizar si realmente cambió la sección
          setSelectedSection(prevSection => {
            return prevSection !== currentSection ? currentSection : prevSection;
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    // Ejecutar una vez al cargar
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Función para copiar waypoint al portapapeles
  const copyWaypoint = async (waypoint: string) => {
    try {
      await navigator.clipboard.writeText(waypoint);
      setCopiedWaypoint(waypoint);
      setTimeout(() => setCopiedWaypoint(null), 2000);
    } catch (err) {
      console.error('Error copying waypoint:', err);
    }
  };


  // Función para copiar Lista 1
  const copyList1 = async () => {
    const list1Waypoints = [
      '[&BE8BAAA=]',
      '[&BAACAAA=]',
      '[&BOwBAAA=]',
      '[&BMcDAAA=]',
      '[&BN4AAAA=]',
      '[&BB0CAAA=]',
      '[&BHgCAAA=]',
      '[&BMAAAAA=]',
      '[&BOYAAAA=]',
      '[&BF8CAAA=]',
      '[&BFECAAA=]',
      '[&BNECAAA=]',
      '[&BFgGAAA=]',
      '[&BMkBAAA=]',
      '[&BKcBAAA=]'
    ];

    // Organizar en bloques de 6
    const blocks = [];
    for (let i = 0; i < list1Waypoints.length; i += 6) {
      blocks.push(list1Waypoints.slice(i, i + 6).join(''));
    }
    const waypointsWithLineBreaks = blocks.join('\n');

    try {
      await navigator.clipboard.writeText(waypointsWithLineBreaks);
      setList1Copied(true);
      setTimeout(() => setList1Copied(false), 2000);
    } catch (err) {
      console.error('Error copying list 1:', err);
    }
  };

  // Función para copiar Lista 2
  const copyList2 = async () => {
    const list2Waypoints = [
      '[&BOQAAAA=]',
      '[&BKsAAAA=]',
      '[&BPoAAAA=]',
      '[&BBIAAAA=]',
      '[&BEIAAAA=]',
      '[&BEABAAA=]',
      '[&BFwAAAA=]',
      '[&BIYHAAA=]',
      '[&BKYCAAA=]',
      '[&BOAHAAA=]',
      '[&BA4IAAA=]',
      '[&BFcLAAA=]',
      '[&BF8JAAA=]',
      '[&BM0JAAA=]',
      '[&BH0JAAA=]'
    ];

    // Organizar en bloques de 6
    const blocks = [];
    for (let i = 0; i < list2Waypoints.length; i += 6) {
      blocks.push(list2Waypoints.slice(i, i + 6).join(''));
    }
    const waypointsWithLineBreaks = blocks.join('\n');

    try {
      await navigator.clipboard.writeText(waypointsWithLineBreaks);
      setList2Copied(true);
      setTimeout(() => setList2Copied(false), 2000);
    } catch (err) {
      console.error('Error copying list 2:', err);
    }
  };

  // Función para copiar Lista 3
  const copyList3 = async () => {
    const list3Text = '[&BNwKAAA=][&BCgKAAA=]x2[&BJEKAAA=][&BEAKAAA=][&BEMLAAA=][&BBsMAAA=][&BCcMAAA=][&BGQMAAA=]x3[&BJ4MAAA=][&BBkNAAA=]x2[&BCANAAA=][&BNQMAAA=][&BFUOAAA=][&BNwNAAA=][&BK4OAAA=]x2[&BC4EAAA=][&BJEPAAA=]';

    try {
      await navigator.clipboard.writeText(list3Text);
      setList3Copied(true);
      setTimeout(() => setList3Copied(false), 2000);
    } catch (err) {
      console.error('Error copying list 3:', err);
    }
  };

  // Función para abrir el modal de imágenes
  const openImageModal = (imageSrc: string, allImages: string[]) => {
    const currentIndex = allImages.findIndex(img => img === imageSrc);
    setImageModal({
      isOpen: true,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      images: allImages
    });
  };

  // Función para cerrar el modal
  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      currentIndex: 0,
      images: []
    });
  };

  // Función para navegar entre imágenes
  const navigateImage = (direction: 'prev' | 'next') => {
    const { currentIndex, images } = imageModal;
    let newIndex;

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    } else {
      newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    }

    setImageModal(prev => ({
      ...prev,
      currentIndex: newIndex
    }));
  };

  // Detectar cambios en el hash de la URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash && ['introduction', 'gardenTypes', 'plants', 'waypoints', 'locations', 'rewards'].includes(hash)) {
        setSelectedSection(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => { window.removeEventListener('hashchange', handleHashChange); };
  }, []);


  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModal.isOpen) {
        closeImageModal();
      }
    };

    if (imageModal.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [imageModal.isOpen]);




  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">

          {/* Header Principal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <Link href="/magic#volatile-magic" className="mr-4 p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                🌱 {t('gardenPage.title')}
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('gardenPage.subtitle')}
            </p>
          </motion.div>

          {/* Layout Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Navegación Desktop */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center mb-6">
                  <BookOpen className="w-5 h-5 text-emerald-400 mr-2" />
                  <h3 className="text-white font-bold text-lg">{t('gardenPage.sidebar.title')}</h3>
                </div>
                <nav className="space-y-1">
                  <button
                    onClick={() => handleScrollTo('introduction')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedSection === 'introduction'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="font-medium">{t('gardenPage.sidebar.introduction')}</span>
                  </button>
                  <button
                    onClick={() => handleScrollTo('gardenTypes')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedSection === 'gardenTypes'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="font-medium">{t('gardenPage.sidebar.gardenTypes')}</span>
                  </button>
                  <button
                    onClick={() => handleScrollTo('plants')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedSection === 'plants'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="font-medium">{t('gardenPage.sidebar.plants')}</span>
                  </button>
                  <button
                    onClick={() => handleScrollTo('waypoints')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedSection === 'waypoints'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="font-medium">{t('gardenPage.sidebar.waypoints')}</span>
                  </button>
                  <button
                    onClick={() => handleScrollTo('locations')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedSection === 'locations'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="font-medium">{t('gardenPage.sidebar.locations')}</span>
                  </button>
                  <button
                    onClick={() => handleScrollTo('rewards')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedSection === 'rewards'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="font-medium">{t('gardenPage.sidebar.rewards')}</span>
                  </button>
                </nav>
              </div>
            </aside>

            {/* FAB - Floating Action Button - Solo en móvil */}
            <div className="lg:hidden fixed bottom-1/2 right-6 transform -translate-y-1/2 z-50">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-14 h-14 bg-emerald-900 hover:bg-emerald-800 text-white rounded-full shadow-lg shadow-emerald-900/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
              >
                {mobileMenuOpen ? <X className="w-8 h-8" /> : <Image src="/images/icons/index.webp" alt="Menu" width={32} height={32} className="w-8 h-8" />}
              </button>
            </div>

            {/* Mobile Menu Panel - Solo en móvil */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}>
                <div className="absolute top-1/2 right-20 transform -translate-y-1/2 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl min-w-[200px] max-w-[250px] w-auto animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 text-emerald-400 mr-2" />
                      <h3 className="text-white font-bold text-lg">{t('gardenPage.sidebar.title')}</h3>
                    </div>
                  </div>
                  <nav className="space-y-1">
                    <button
                      onClick={() => handleScrollTo('introduction')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedSection === 'introduction'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                    >
                      <span className="font-medium">{t('gardenPage.sidebar.introduction')}</span>
                    </button>
                    <button
                      onClick={() => handleScrollTo('gardenTypes')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedSection === 'gardenTypes'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                    >
                      <span className="font-medium">{t('gardenPage.sidebar.gardenTypes')}</span>
                    </button>
                    <button
                      onClick={() => handleScrollTo('plants')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedSection === 'plants'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                    >
                      <span className="font-medium">{t('gardenPage.sidebar.plants')}</span>
                    </button>
                    <button
                      onClick={() => handleScrollTo('waypoints')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedSection === 'waypoints'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                    >
                      <span className="font-medium">{t('gardenPage.sidebar.waypoints')}</span>
                    </button>
                    <button
                      onClick={() => handleScrollTo('locations')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedSection === 'locations'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                    >
                      <span className="font-medium">{t('gardenPage.sidebar.locations')}</span>
                    </button>
                    <button
                      onClick={() => handleScrollTo('rewards')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedSection === 'rewards'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                    >
                      <span className="font-medium">{t('gardenPage.sidebar.rewards')}</span>
                    </button>
                  </nav>
                </div>
              </div>
            )}

            {/* Contenido Principal */}
            <main className="lg:col-span-3">

              {/* Sección de Introducción */}
              <section id="introduction" className="mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8"
                >
                  <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                    <Info className="w-8 h-8 text-emerald-400 mr-3" />
                    {t('gardenPage.sections.introduction.title')}
                  </h2>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('gardenPage.sections.introduction.content1')}
                  </p>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('gardenPage.sections.introduction.content2')}
                  </p>
                  <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-emerald-300 mb-4 flex items-center">
                      <Target className="w-6 h-6 mr-2" />
                      {t('gardenPage.sections.introduction.objective')}
                    </h3>
                    <p className="text-gray-300">
                      {t('gardenPage.sections.introduction.objectiveContent')}
                    </p>
                  </div>
                </motion.div>
              </section>

              {/* Sección de Herramientas de Recolección */}
              <section id="gardenTypes" className="mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                    <Hammer className="w-8 h-8 text-emerald-400 mr-3" />
                    {t('gardenPage.sections.gardenTypes.title')}
                  </h2>

                  <p className="text-gray-300 mb-8 text-lg">
                    {t('gardenPage.sections.gardenTypes.description')}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Plantas */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:border-emerald-500/50 transition-all duration-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 flex items-center justify-center">
                          <Image
                            src="https://wiki.guildwars2.com/images/2/2d/Plant_resource_%28map_icon%29.png"
                            alt="Plant resource icon"
                            width={50}
                            height={50}
                            className="w-12 h-12"
                            unoptimized
                          />
                        </div>
                        <h3 className="text-xl font-bold text-white">{t('gardenPage.sections.gardenTypes.plants')}</h3>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 space-y-3">
                        {/* Hoz del Consorcio */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <Image
                              src={consortiumSickleData?.icon || "https://wiki-es.guildwars2.com/images/3/3e/Hoz_de_recolecci%C3%B3n_del_Consorcio.png"}
                              alt={consortiumSickleData?.name || t('gardenPage.sections.gardenTypes.consortiumSickle')}
                              width={24}
                              height={24}
                              className="w-6 h-6"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://wiki.guildwars2.com/images/3/3e/Consortium_Harvesting_Sickle.png";
                              }}
                            />
                            <WikiTooltip
                              itemId={42594}
                              itemData={consortiumSickleData}
                              fallbackName={t('gardenPage.sections.gardenTypes.consortiumSickle')}
                              className="text-emerald-300 font-medium text-sm hover:text-emerald-200 hover:underline transition-colors"
                            >
                              {consortiumSickleData?.name || t('gardenPage.sections.gardenTypes.consortiumSickle')}
                            </WikiTooltip>
                          </div>
                          <span className="text-xs text-emerald-400/70 ml-9">{t('gardenPage.sections.gardenTypes.speed')}: 150%</span>
                        </div>

                        {/* Herramienta Alternativa */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <Image
                              src={alternativeSickleData?.icon || "https://wiki.guildwars2.com/images/d/df/Eldritch_Horror_Harvesting_Tool.png"}
                              alt={alternativeSickleData?.name || t('gardenPage.sections.gardenTypes.eldritchHorrorHarvestingTool')}
                              width={24}
                              height={24}
                              className="w-6 h-6"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://wiki.guildwars2.com/images/d/df/Eldritch_Horror_Harvesting_Tool.png";
                              }}
                            />
                            <WikiTooltip
                              itemId={102000}
                              itemData={alternativeSickleData}
                              fallbackName={t('gardenPage.sections.gardenTypes.eldritchHorrorHarvestingTool')}
                              className="text-emerald-300 font-medium text-sm hover:text-emerald-200 hover:underline transition-colors"
                            >
                              {alternativeSickleData?.name || t('gardenPage.sections.gardenTypes.eldritchHorrorHarvestingTool')}
                            </WikiTooltip>
                          </div>
                          <span className="text-xs text-emerald-400/70 ml-9">{t('gardenPage.sections.gardenTypes.speed')}: 166%</span>
                        </div>

                        {/* Herramienta Alternativa 2 */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <Image
                              src={alternativeMSickleData?.icon || "https://wiki.guildwars2.com/images/1/1b/Fused_Molten_Sickle.png"}
                              alt={alternativeMSickleData?.name || t('gardenPage.sections.gardenTypes.fusedMoltenSickle')}
                              width={24}
                              height={24}
                              className="w-6 h-6"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://wiki.guildwars2.com/images/1/1b/Fused_Molten_Sickle.png";
                              }}
                            />
                            <WikiTooltip
                              itemId={67032}
                              itemData={alternativeMSickleData}
                              fallbackName={t('gardenPage.sections.gardenTypes.fusedMoltenSickle')}
                              className="text-emerald-300 font-medium text-sm hover:text-emerald-200 hover:underline transition-colors"
                            >
                              {alternativeMSickleData?.name || t('gardenPage.sections.gardenTypes.fusedMoltenSickle')}
                            </WikiTooltip>
                          </div>
                          <span className="text-xs text-emerald-400/70 ml-9">{t('gardenPage.sections.gardenTypes.speed')}: 150%</span>
                        </div>

                        {/* Herramienta Alternativa 3 */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <Image
                              src={volatileHarvestingSickleData?.icon || "https://wiki.guildwars2.com/images/5/57/Volatile_Harvesting_Sickle.png"}
                              alt={volatileHarvestingSickleData?.name || t('gardenPage.sections.gardenTypes.volatileHarvestingSickle')}
                              width={24}
                              height={24}
                              className="w-6 h-6"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://wiki.guildwars2.com/images/5/57/Volatile_Harvesting_Sickle.png";
                              }}
                            />
                            <WikiTooltip
                              itemId={85733}
                              itemData={volatileHarvestingSickleData}
                              fallbackName={t('gardenPage.sections.gardenTypes.volatileHarvestingSickle')}
                              className="text-emerald-300 font-medium text-sm hover:text-emerald-200 hover:underline transition-colors"
                            >
                              {volatileHarvestingSickleData?.name || t('gardenPage.sections.gardenTypes.volatileHarvestingSickle')}
                            </WikiTooltip>
                          </div>
                          <span className="text-xs text-emerald-400/70 ml-9">{t('gardenPage.sections.gardenTypes.speed')}: 100%</span>
                        </div>


                      </div>
                    </div>



                    {/* Mineral */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:border-emerald-500/50 transition-all duration-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 flex items-center justify-center">
                          <Image
                            src="https://wiki.guildwars2.com/images/3/34/Mine_resource_%28map_icon%29.png"
                            alt="Mine resource icon"
                            width={50}
                            height={50}
                            className="w-12 h-12"
                            unoptimized
                          />
                        </div>
                        <h3 className="text-xl font-bold text-white">{t('gardenPage.sections.gardenTypes.mineral')}</h3>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                        <div className="flex items-center gap-3">
                          <Image
                            src={unboundMiningData?.icon || "https://wiki.guildwars2.com/images/f/f2/Unbound_Magic_Mining_Beam.png"}
                            alt={unboundMiningData?.name || t('gardenPage.sections.gardenTypes.unboundMining')}
                            width={24}
                            height={24}
                            className="w-6 h-6"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://wiki.guildwars2.com/images/f/f2/Unbound_Magic_Mining_Beam.png";
                            }}
                          />
                          <WikiTooltip
                            itemId={80977}
                            itemData={unboundMiningData}
                            fallbackName={t('gardenPage.sections.gardenTypes.unboundMining')}
                            className="text-emerald-300 font-medium text-sm hover:text-emerald-200 hover:underline transition-colors"
                          >
                            {unboundMiningData?.name || t('gardenPage.sections.gardenTypes.unboundMining')}
                          </WikiTooltip>
                        </div>
                      </div>
                    </div>

                    {/* Madera */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:border-emerald-500/50 transition-all duration-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 flex items-center justify-center">
                          <Image
                            src="https://wiki.guildwars2.com/images/f/f1/Wood_resource_%28map_icon%29.png"
                            alt="Wood resource icon"
                            width={50}
                            height={50}
                            className="w-12 h-12"
                            unoptimized
                          />
                        </div>
                        <h3 className="text-xl font-bold text-white">{t('gardenPage.sections.gardenTypes.wood')}</h3>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                        <div className="flex items-center gap-3">
                          <Image
                            src={unboundLoggingData?.icon || "https://wiki.guildwars2.com/images/c/c5/Unbound_Magic_Logging_Pulse.png"}
                            alt={unboundLoggingData?.name || t('gardenPage.sections.gardenTypes.unboundLogging')}
                            width={24}
                            height={24}
                            className="w-6 h-6"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://wiki.guildwars2.com/images/c/c5/Unbound_Magic_Logging_Pulse.png";
                            }}
                          />
                          <WikiTooltip
                            itemId={80979}
                            itemData={unboundLoggingData}
                            fallbackName={t('gardenPage.sections.gardenTypes.unboundLogging')}
                            className="text-emerald-300 font-medium text-sm hover:text-emerald-200 hover:underline transition-colors"
                          >
                            {unboundLoggingData?.name || t('gardenPage.sections.gardenTypes.unboundLogging')}
                          </WikiTooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* Información adicional sobre glifos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-300 text-lg mb-16 -mt-8"
              >
                <p className="mb-4">
                  {t('gardenPage.sections.glyphs.requirement')}
                  <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <Image
                      src={volatileMagicGlyphData?.icon || "https://wiki-es.guildwars2.com/images/d/d2/Glifo_de_volatilidad.png"}
                      alt={volatileMagicGlyphData?.name || t('gardenPage.sections.glyphs.fallbackName')}
                      width={16}
                      height={16}
                      className="rounded inline"
                      unoptimized
                    />
                    <WikiTooltip
                      itemId={87698}
                      itemData={volatileMagicGlyphData}
                      fallbackName={t('gardenPage.sections.glyphs.fallbackName')}
                      className="hover:text-emerald-200 hover:underline transition-colors"
                    >
                      {volatileMagicGlyphData?.name || t('gardenPage.sections.glyphs.fallbackName')}
                    </WikiTooltip>
                  </span>
                  {t('gardenPage.sections.glyphs.benefit')}
                </p>
              </motion.div>

              {/* Sección de Buffs */}
              <section id="plants" className="mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                    <Zap className="w-8 h-8 text-emerald-400 mr-3" />
                    {t('gardenPage.sections.buffs.title')}
                  </h2>

                  <div className="space-y-6">
                    {/* Item Booster */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        {itemBoosterData?.icon && (
                          <Image
                            src={itemBoosterData.icon}
                            alt={itemBoosterData.name}
                            width={32}
                            height={32}
                            className="w-8 h-8"
                            unoptimized
                          />
                        )}
                        <h3 className="text-xl font-bold text-white">
                          <WikiTooltip
                            itemId={20003}
                            itemData={itemBoosterData}
                            fallbackName={t('gardenPage.sections.buffs.itemBooster.title')}
                            className="hover:text-emerald-400 transition-colors"
                          >
                            {itemBoosterData?.name || t('gardenPage.sections.buffs.itemBooster.title')}
                          </WikiTooltip>
                        </h3>
                      </div>
                      <p className="text-gray-300 mb-2">{t('gardenPage.sections.buffs.itemBooster.description')}</p>
                      <p className="text-gray-400 text-sm italic whitespace-pre-line">{t('gardenPage.sections.buffs.itemBooster.note')}</p>
                    </div>

                    {/* Guild Gathering Banner Booster */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        {guildBannerData?.icon && (
                          <Image
                            src={guildBannerData.icon}
                            alt={guildBannerData.name}
                            width={32}
                            height={32}
                            className="w-8 h-8"
                            unoptimized
                          />
                        )}
                        <h3 className="text-xl font-bold text-white">
                          <WikiTooltip
                            itemId={39699}
                            itemData={guildBannerData}
                            fallbackName={t('gardenPage.sections.buffs.guildBanner.title')}
                            className="hover:text-emerald-400 transition-colors"
                          >
                            {guildBannerData?.name || t('gardenPage.sections.buffs.guildBanner.title')}
                          </WikiTooltip>
                        </h3>
                      </div>
                    </div>

                    {/* XP Booster / Candy Gobbler */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {xpBoosterData?.icon && (
                            <Image
                              src={xpBoosterData.icon}
                              alt={xpBoosterData.name}
                              width={32}
                              height={32}
                              className="w-8 h-8"
                              unoptimized
                            />
                          )}
                          <WikiTooltip
                            itemId={20002}
                            itemData={xpBoosterData}
                            fallbackName="XP Booster"
                            className="text-xl font-bold text-white hover:text-emerald-400 transition-colors"
                          >
                            {xpBoosterData?.name || 'XP Booster'}
                          </WikiTooltip>
                        </div>
                        <span className="text-gray-400 text-xl">/</span>
                        <div className="flex items-center gap-2">
                          {candyGobblerData?.icon && (
                            <Image
                              src={candyGobblerData.icon}
                              alt={candyGobblerData.name}
                              width={32}
                              height={32}
                              className="w-8 h-8"
                              unoptimized
                            />
                          )}
                          <WikiTooltip
                            itemId={67393}
                            itemData={candyGobblerData}
                            fallbackName="Candy Gobbler"
                            className="text-xl font-bold text-white hover:text-emerald-400 transition-colors"
                          >
                            {candyGobblerData?.name || 'Candy Gobbler'}
                          </WikiTooltip>
                        </div>
                      </div>
                    </div>
                    {/* Experience Note */}
                    <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6">
                      <p className="text-gray-300 text-lg">{t('gardenPage.sections.buffs.experienceNote')}</p>
                    </div>
                  </div>
                </motion.div>
              </section>


              {/* Sección de Waypoints */}
              <section id="waypoints" className="mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8"
                >
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                    <Image
                      src="images/icons/waypoint-icon.webp"
                      alt="Waypoint icon"
                      width={50}
                      height={50}
                      className="w-11 h-11 mr-3"
                      unoptimized
                    />
                    {t('gardenPage.sections.waypoints.title')}
                  </h2>

                  <p className="text-gray-300 mb-8 text-lg">
                    {t('gardenPage.sections.waypoints.description')}
                  </p>

                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {t('gardenPage.sections.waypoints.title')}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Primera Lista */}
                    <div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-full">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-emerald-300 font-semibold text-sm">
                              {t('gardenPage.sections.waypoints.chat1')}
                            </span>
                          </div>
                          <button
                            onClick={copyList1}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            {list1Copied ? t('gardenPage.sections.waypoints.listCopied') : t('gardenPage.sections.waypoints.copyList')}
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                        <div className="text-gray-300 text-lg font-mono break-all leading-relaxed">
                          [&BE8BAAA=][&BAACAAA=][&BOwBAAA=][&BMcDAAA=][&BN4AAAA=][&BB0CAAA=][&BHgCAAA=][&BMAAAAA=][&BOYAAAA=][&BF8CAAA=][&BFECAAA=][&BNECAAA=][&BFgGAAA=][&BMkBAAA=][&BKcBAAA=]
                        </div>
                      </div>
                    </div>

                    {/* Segunda Lista */}
                    <div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-blue-300 font-semibold text-sm">
                              {t('gardenPage.sections.waypoints.chat2')}
                            </span>
                          </div>
                          <button
                            onClick={copyList2}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            {list2Copied ? t('gardenPage.sections.waypoints.listCopied') : t('gardenPage.sections.waypoints.copyList')}
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                        <div className="text-gray-300 text-lg font-mono break-all leading-relaxed">
                          [&BOQAAAA=][&BKsAAAA=][&BPoAAAA=][&BBIAAAA=][&BEIAAAA=][&BEABAAA=][&BFwAAAA=][&BIYHAAA=][&BKYCAAA=][&BOAHAAA=][&BA4IAAA=][&BFcLAAA=][&BF8JAAA=][&BM0JAAA=][&BH0JAAA=]
                        </div>
                      </div>
                    </div>

                    {/* Tercera Lista */}
                    <div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                            <span className="text-purple-300 font-semibold text-sm">
                              {t('gardenPage.sections.waypoints.chat3')}
                            </span>
                          </div>
                          <button
                            onClick={copyList3}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            {list3Copied ? t('gardenPage.sections.waypoints.listCopied') : t('gardenPage.sections.waypoints.copyList')}
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                        <div className="text-gray-300 text-lg font-mono break-all leading-relaxed">
                          [&BNwKAAA=][&BCgKAAA=]<span className="text-yellow-400 font-bold">x2</span>[&BJEKAAA=][&BEAKAAA=][&BEMLAAA=][&BBsMAAA=][&BCcMAAA=][&BGQMAAA=]<span className="text-red-400 font-bold">x3</span>[&BJ4MAAA=][&BBkNAAA=]<span className="text-yellow-400 font-bold">x2</span>[&BCANAAA=][&BNQMAAA=][&BFUOAAA=][&BNwNAAA=][&BK4OAAA=]<span className="text-yellow-400 font-bold">x2</span>[&BC4EAAA=][&BJEPAAA=]
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* Sección de Ubicaciones de Jardines - Updated */}
              <section id="locations" className="mt-8 mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 max-w-6xl mx-auto"
                >
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                    <MapPin className="w-8 h-8 text-emerald-400 mr-3" />
                    {t('gardenPage.sections.locations.title')}
                  </h2>

                  <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-6 mb-8">
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {t('gardenPage.sections.locations.description')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Fields of Ruin - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/test.png', gardenImages)}
                      >
                        <Image
                          src="/images/garden/test.png"
                          alt="Fields of Ruin Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[21]?.name || 'Fields of Ruin'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-emerald-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.ogreRoad')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BE8BAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BE8BAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BE8BAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BE8BAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Fireheart Rise - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-teal-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/20">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/test2.png', gardenImages)}
                      >
                        <Image
                          src="/images/garden/test2.png"
                          alt="Fireheart Rise"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[20]?.name || 'Blazeridge Steppes'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-teal-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.guardianStone')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BAACAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BAACAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BAACAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BAACAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Iron Marches - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-3.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-3.webp"
                          alt={mapData[25]?.name || 'Iron Marches Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[25]?.name || 'Iron Marches'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-purple-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.bulwark')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BOwBAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BOwBAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BOwBAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BOwBAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Plains of Ashford - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-orange-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-4.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-4.webp"
                          alt={mapData[19]?.name || 'Plains of Ashford Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[19]?.name || 'Plains of Ashford'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-orange-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.loreclaw')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BMcDAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BMcDAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BMcDAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BMcDAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Diessa Plateau - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-blue-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-5.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-5.webp"
                          alt={mapData[32]?.name || 'Diessa Plateau Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[32]?.name || 'Diessa Plateau'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-blue-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.nolan')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BN4AAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BN4AAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BN4AAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BN4AAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Fireheart Rise - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-red-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-6.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-6.webp"
                          alt={mapData[22]?.name || 'Fireheart Rise Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[22]?.name || 'Fireheart Rise'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-red-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.apostate')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BB0CAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BB0CAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BB0CAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BB0CAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Gendarran Fields - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-7.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-7.webp"
                          alt={mapData[30]?.name || 'Gendarran Fields Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[30]?.name || 'Gendarran Fields'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-indigo-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.gendarranFields')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BHgCAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BHgCAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BHgCAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BHgCAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Harathi Hinterlands - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-lime-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-lime-500/20">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-8.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-8.webp"
                          alt={mapData[31]?.name || 'Harathi Hinterlands Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[31]?.name || 'Harathi Hinterlands'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-lime-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.harathiHinterlands')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BMAAAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BMAAAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-500 hover:to-green-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BMAAAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BMAAAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Kessex Hills - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-rose-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/20">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-9.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-9.webp"
                          alt={mapData[27]?.name || 'Kessex Hills Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[27]?.name || 'Kessex Hills'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-rose-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.kessexHills')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BOYAAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BOYAAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BOYAAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BOYAAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Lornar's Pass - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-sky-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/20">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-10.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-10.webp"
                          alt={mapData[26]?.name || 'Lornar\'s Pass Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[26]?.name || 'Lornar\'s Pass'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-sky-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.lornarsPass')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BF8CAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BF8CAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BF8CAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BF8CAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Bloodtide Coast - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-11.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-11.webp"
                          alt={mapData[29]?.name || 'Bloodtide Coast Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[29]?.name || 'Bloodtide Coast'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-cyan-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.bloodtideCoast')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BFECAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BFECAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BFECAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BFECAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Dredgehaunt Cliffs - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-violet-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-12.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-12.webp"
                          alt={mapData[39]?.name || 'Dredgehaunt Cliffs Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[39]?.name || 'Dredgehaunt Cliffs'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-violet-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.dredgehauntCliffs')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BNECAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BNECAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BNECAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BNECAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Frostgorge Sound - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-ice-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-ice-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-13.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-13.webp"
                          alt={mapData[51]?.name || 'Frostgorge Sound Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[51]?.name || 'Frostgorge Sound'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-ice-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.frostgorgeSound')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BFgGAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BFgGAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BFgGAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BFgGAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Mount Maelstrom - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-amber-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-14.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-14.webp"
                          alt={mapData[53]?.name || 'Mount Maelstrom Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[53]?.name || 'Mount Maelstrom'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-amber-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.mountMaelstrom')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BMkBAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BMkBAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BMkBAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BMkBAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Sparkfly Fen - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-15.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-15.webp"
                          alt={mapData[73]?.name || 'Sparkfly Fen Garden Location'}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[73]?.name || 'Sparkfly Fen'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-emerald-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.sparkflyFen')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BKcBAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BKcBAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BKcBAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BKcBAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Lista 2 - Nuevas ubicaciones de jardines */}

                    {/* Gendarran Fields - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-16.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-16.webp"
                          alt="Gendarran Fields Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[24]?.name || 'Gendarran Fields'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-yellow-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.claypool')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BOQAAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BOQAAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BOQAAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BOQAAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Interior Harathi - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-green-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-17.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-17.webp"
                          alt="Caledon Forest Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[17]?.name || 'Interior Harathi'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-green-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.kessexHills2')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BKsAAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BKsAAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BKsAAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BKsAAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Queensdale - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-teal-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-18.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-18.webp"
                          alt="Metrica Province Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[15]?.name || 'Queensdale'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-teal-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.rataSum')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BPoAAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BPoAAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BPoAAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BPoAAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Kessex Hills - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-19.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-19.webp"
                          alt="Kessex Hills Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[23]?.name || 'Kessex Hills'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-purple-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.brisbanWildlands')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BBIAAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BBIAAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BBIAAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BBIAAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Metrica Province - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-20.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-20.webp"
                          alt="Metrica Province Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[35]?.name || 'Metrica Province'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-cyan-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.snowdenDrifts')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BEIAAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BEIAAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BEIAAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BEIAAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Caledon Forest - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-rose-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-21.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-21.webp"
                          alt="Caledon Forest Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[34]?.name || 'Caledon Forest'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-rose-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.divinitysReach')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BEABAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BEABAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BEABAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BEABAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Brisban Wildlands - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-blue-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-22-524x1024.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-22-524x1024.webp"
                          alt="Brisban Wildlands Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[54]?.name || 'Brisban Wildlands'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-blue-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.wayfarerFoothills')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BFwAAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BFwAAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BFwAAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BFwAAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Dry Top - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-lime-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-lime-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-23.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-23.webp"
                          alt="Dry Top Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[988]?.name || 'Dry Top'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-lime-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.timberlineFalls')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BIYHAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BIYHAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-500 hover:to-green-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BIYHAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BIYHAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Malchor's Leap - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-orange-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Tyria-24.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Tyria-24.webp"
                          alt="Malchor's Leap Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[65]?.name || 'Malchor\'s Leap'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-orange-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.southsunCove')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BKYCAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BKYCAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BKYCAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BKYCAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Jaka Itzel - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-amber-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/HoT-1.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/HoT-1.webp"
                          alt="Jaka Itzel Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1052]?.name || 'Jaka Itzel'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-amber-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.dryTop')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BOAHAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BOAHAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BOAHAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BOAHAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Tangled Depths- Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-red-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/HoT-2-1024x802.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/HoT-2-1024x802.webp"
                          alt="Tangled Depths Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1045]?.name || 'Tangled Depths'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-red-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.silverwastes')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BA4IAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BA4IAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BA4IAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BA4IAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Domain of Kourna - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS4-2.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS4-2.webp"
                          alt="Domain of Kourna Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1288]?.name || 'Domain of Kourna'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-yellow-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.auricBasin')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BFcLAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BFcLAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BFcLAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BFcLAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Ember Bay - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-green-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS3-1.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS3-1.webp"
                          alt="Ember Bay Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1175]?.name || 'Ember Bay'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-green-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.tangledDepths')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BF8JAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BF8JAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BF8JAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BF8JAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Draconis Mons - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS3-2.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS3-2.webp"
                          alt="Draconis Mons Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1195]?.name || 'Draconis Mons'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-purple-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.dragonsStand')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BM0JAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BM0JAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BM0JAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BM0JAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Bitterfrost Frontier - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-red-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS3-3-1024x425.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS3-3-1024x425.webp"
                          alt="Bitterfrost Frontier Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1178]?.name || 'Bitterfrost Frontier'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-red-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.bloodstoneFen')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BH0JAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BH0JAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BH0JAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BH0JAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Lista 3 - Ubicaciones con multiplicadores */}

                    {/* The Desolation - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/POF-1.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/POF-1.webp"
                          alt="The Desolation Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1226]?.name || 'The Desolation'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-yellow-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.thedesolation')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BNwKAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BNwKAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BNwKAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BNwKAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Elon Riverlands - Primera vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-green-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/POF-2-923x1024.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/POF-2-923x1024.webp"
                          alt="Elon Riverlands Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1228]?.name || 'Elon Riverlands'} (1/2)
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-green-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.eloniverlands')} <span className="text-yellow-400 font-bold">x2</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BCgKAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BCgKAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BCgKAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BCgKAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Elon Riverlands - Segunda vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-green-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/POF-3-1024x361.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/POF-3-1024x361.webp"
                          alt="Elon Riverlands Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1228]?.name || 'Elon Riverlands'} (2/2)
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-green-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.eloniverlands')} <span className="text-yellow-400 font-bold">x2</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BCgKAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BCgKAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BCgKAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BCgKAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Desert Highlands - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/POF-4-1-630x1024.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/POF-4-1-630x1024.webp"
                          alt="Desert Highlands Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1211]?.name || 'Desert Highlands'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-purple-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.deserthighlands')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BJEKAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BJEKAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BJEKAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BJEKAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Crystal Oasis - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/PoF-5.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/PoF-5.webp"
                          alt="Crystal Oasis Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1210]?.name || 'Crystal Oasis'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-emerald-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.crystaloasis')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BEAKAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BEAKAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BEAKAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BEAKAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Sandswept Isles - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-red-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS4-1.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS4-1.webp"
                          alt="Sandswept Isles Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1271]?.name || 'Sandswept Isles'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-red-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.sandsweptIsles')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BEMLAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BEMLAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BEMLAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BEMLAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Grothmar Valley - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-blue-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS5-1.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS5-1.webp"
                          alt="Grothmar Valley Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1330]?.name || 'Grothmar Valley'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-blue-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.grothmarvalley')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BBsMAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BBsMAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BBsMAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BBsMAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Bjora Marches - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-orange-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS5-3.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS5-3.webp"
                          alt="Bjora Marches Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1343]?.name || 'Bjora Marches'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-orange-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.bjoramarches')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BCcMAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BCcMAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BCcMAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BCcMAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Drizzlewood Coast - Primera vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS5-2.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS5-2.webp"
                          alt="Drizzlewood Coast Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1371]?.name || 'Drizzlewood Coast'} (1/3)
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-cyan-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.drizzlewoodcoast')} <span className="text-red-400 font-bold">x3</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BGQMAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BGQMAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BGQMAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BGQMAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Drizzlewood Coast - Segunda vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS5-4.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS5-4.webp"
                          alt="Drizzlewood Coast Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1371]?.name || 'Drizzlewood Coast'} (2/3)
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-cyan-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.drizzlewoodcoast')} <span className="text-red-400 font-bold">x3</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BGQMAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BGQMAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BGQMAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BGQMAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Drizzlewood Coast - Tercera vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/LS5-5.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/LS5-5.webp"
                          alt="Drizzlewood Coast Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1371]?.name || 'Drizzlewood Coast'} (3/3)
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-cyan-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.drizzlewoodcoast')} <span className="text-red-400 font-bold">x3</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BGQMAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BGQMAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BGQMAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BGQMAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>


                    {/* Seitung Province */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/EoD-5.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/EoD-5.webp"
                          alt="Seitung Province Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1442]?.name || 'Seitung Province'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-emerald-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.seitung')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BJ4MAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BJ4MAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BJ4MAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BJ4MAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* New Kaineng City - Primera vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-amber-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/EoD-1-709x1024.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/EoD-1-709x1024.webp"
                          alt="New Kaineng City Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1438]?.name || 'New Kaineng City'} (1/2)
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-amber-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.newKainengCity')} <span className="text-yellow-400 font-bold">x2</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BBkNAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BBkNAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BBkNAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BBkNAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* New Kaineng City - Segunda vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-amber-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/EoD-2.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/EoD-2.webp"
                          alt="New Kaineng City Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1438]?.name || 'New Kaineng City'} (2/2)
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-amber-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.newKainengCity')} <span className="text-yellow-400 font-bold">x2</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BBkNAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BBkNAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BBkNAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BBkNAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* New Kaineng City - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-sand-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-sand-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/EoD-3.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/EoD-3.webp"
                          alt="New Kaineng City Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1438]?.name || 'New Kaineng City'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-yellow-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.newKainengCity2')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BCANAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BCANAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BCANAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BCANAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* The Echovald Wilds - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-lime-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-lime-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/EoD-4.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/EoD-4.webp"
                          alt="The Echovald Wilds Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1452]?.name || 'The Echovald Wilds'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-lime-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.theechovaldwilds')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BNQMAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BNQMAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-500 hover:to-green-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BNQMAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BNQMAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Skywatch Archipelago - Estilo Uniforme */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/SOTO-1-1024x458.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/SOTO-1-1024x458.webp"
                          alt="Skywatch Archipelago Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1510]?.name || 'Skywatch Archipelago'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-indigo-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.skywatchArchipelago')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BFUOAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BFUOAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BFUOAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BFUOAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Skywatch Archipelago - Primera vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-violet-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/SOTO-2-514x1024.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/SOTO-2-514x1024.webp"
                          alt="Skywatch Archipelago Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1510]?.name || 'Skywatch Archipelago'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-violet-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.skywatchArchipelago2')}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BNwNAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BNwNAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BNwNAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BNwNAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/*Lowland Shore - Primera vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-rose-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-72 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/JW-1.png', gardenImages)}
                      >
                        <Image
                          src="/images/garden/JW-1.png"
                          alt="Lowland Shore Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1550]?.name || 'Lowland Shore'} (1/2)
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-rose-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.lowlandShore')} <span className="text-yellow-400 font-bold">x2</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BK4OAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BK4OAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BK4OAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BK4OAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Lowland Shore - Segunda vez */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-rose-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-48 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/JW-2.png', gardenImages)}
                      >
                        <Image
                          src="/images/garden/JW-2.png"
                          alt="Lowland Shore Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                          priority
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[1550]?.name || 'Lowland Shore'} (2/2)
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-rose-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.lowlandShore')} <span className="text-yellow-400 font-bold">x2</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BK4OAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BK4OAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BK4OAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BK4OAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Lion's Arch - Waypoint BC4EAAA */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-48 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/Lion-Arch.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/Lion-Arch.webp"
                          alt="Lion's Arch Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {mapData[50]?.name || 'Lion\'s Arch'}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-purple-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.lionArch') || 'Western Ward Waypoint'}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BC4EAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BC4EAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BC4EAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BC4EAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Shipwreck Strand - Waypoint BJEPAAA */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 h-full flex flex-col">
                      {/* Imagen con dimensiones uniformes */}
                      <div
                        className="relative h-48 w-full overflow-hidden cursor-pointer"
                        onClick={() => openImageModal('/images/garden/VoE.webp', gardenImages)}
                      >
                        <Image
                          src="/images/garden/VoE.webp"
                          alt="Shipwreck Strand Garden Location"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {/* Overlay sutil para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Icono de zoom para indicar que se puede hacer clic */}
                        <div className="absolute top-2 right-2 opacity-100 transition-opacity duration-300">
                          <Image
                            src="/images/garden/zoom-in.webp"
                            alt="Zoom"
                            width={20}
                            height={20}
                            className="w-5 h-5 invert"
                            unoptimized
                          />
                        </div>

                      </div>

                      {/* Contenido uniforme */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {t('magicMirrors.maps.shipwreckStrand', 'Shipwreck Strand')}
                        </h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/40 mb-4">
                          <p className="text-purple-300 font-semibold flex items-center gap-3 text-sm">
                            <Image
                              src="/images/icons/waypoint-icon.webp"
                              alt="Waypoint"
                              width={20}
                              height={20}
                              className="w-7 h-7"
                            />
                            {t('gardenPage.waypoints.pubCanach') || 'Pub Canach Waypoint'}
                          </p>
                        </div>

                        <button
                          onClick={() => copyWaypoint('[&BJEPAAA=]')}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm mt-auto ${copiedWaypoint === '[&BJEPAAA=]'
                            ? 'bg-green-600 text-white shadow-xl'
                            : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            }`}
                        >
                          {copiedWaypoint === '[&BJEPAAA=]' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedWaypoint === '[&BJEPAAA=]'
                            ? t('gardenPage.sections.locations.waypointCopied')
                            : t('gardenPage.sections.locations.copyWaypoint')
                          }
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              </section>

              {/* Sección de Recompensas */}
              <section id="rewards" className="mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-2xl p-8 border border-emerald-500/30"
                >
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                    <Coins className="w-8 h-8 text-emerald-400 mr-3" />
                    {t('gardenPage.sections.rewards.title')}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50 text-center">
                      <h3 className="text-white font-semibold mb-3">{t('gardenPage.sections.rewards.personalGarden')}</h3>
                      <p className="text-2xl font-bold text-emerald-400 mb-2">{t('gardenPage.sections.rewards.time')}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50 text-center">
                      <h3 className="text-white font-semibold mb-3">{t('gardenPage.sections.rewards.guildGardens')}</h3>
                      <div className="flex items-center justify-center mb-2">
                        <Image
                          src="/images/expansions/volatile-magic.webp"
                          alt="Volatile Magic"
                          width={24}
                          height={24}
                          className="mr-2"
                        />
                        <p className="text-2xl font-bold text-green-400">{t('gardenPage.sections.rewards.volatileMagic')}</p>
                      </div>
                      <p className="text-yellow-400 text-sm font-semibold">{t('gardenPage.sections.rewards.profit')}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50 text-center">
                      <h3 className="text-white font-semibold mb-3">{t('gardenPage.sections.rewards.worldGardens')}</h3>
                      <div className="flex items-center justify-center mb-2">
                        <Image
                          src="/images/expansions/Spirit_Shard.webp"
                          alt="Spirit Shards"
                          width={24}
                          height={24}
                          className="mr-2"
                        />
                        <p className="text-2xl font-bold text-teal-400">{t('gardenPage.sections.rewards.spiritShards')}</p>
                      </div>
                      <p className="text-yellow-400 text-sm font-semibold">{t('gardenPage.sections.rewards.spiritShardsProfit')}</p>
                    </div>
                  </div>
                </motion.div>
              </section>

            </main>
          </div>
        </div>
      </div>

      {/* Modal de visualización de imágenes */}
      {imageModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={closeImageModal}
          role="presentation"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-white/10 bg-black/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cerrar */}
            <button
              type="button"
              onClick={closeImageModal}
              className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-3 text-white shadow-lg ring-1 ring-white/10 transition-colors hover:bg-black/80"
              aria-label={t('gardenPage.sections.locations.closeImage', 'Cerrar imagen')}
            >
              <X className="h-9 w-9" strokeWidth={2.25} />
            </button>

            {/* Botón anterior */}
            <button
              type="button"
              onClick={() => navigateImage('prev')}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-4 text-white shadow-lg ring-1 ring-white/10 transition-colors hover:bg-black/80"
              aria-label={t('gardenPage.sections.locations.prevImage', 'Imagen anterior')}
            >
              <ChevronLeft className="h-9 w-9" strokeWidth={2.25} />
            </button>

            {/* Botón siguiente */}
            <button
              type="button"
              onClick={() => navigateImage('next')}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-4 text-white shadow-lg ring-1 ring-white/10 transition-colors hover:bg-black/80"
              aria-label={t('gardenPage.sections.locations.nextImage', 'Imagen siguiente')}
            >
              <ChevronRight className="h-9 w-9" strokeWidth={2.25} />
            </button>

            {/* Imagen principal */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-14 pb-4 pt-14 sm:px-16">
              <Image
                src={imageModal.images[imageModal.currentIndex]}
                alt={`Garden location ${imageModal.currentIndex + 1}`}
                width={1200}
                height={800}
                className="max-h-[min(72vh,calc(90vh-8rem))] max-w-full object-contain"
                unoptimized
              />
            </div>

            {/* Pie: waypoint + copiar + contador */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 bg-black/85 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <code className="block min-w-0 flex-1 break-all font-mono text-sm text-emerald-300 sm:text-base">
                {gardenWaypoints[imageModal.currentIndex] ?? ''}
              </code>
              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                <span className="text-sm tabular-nums text-white/80">
                  {imageModal.currentIndex + 1} / {imageModal.images.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const wp = gardenWaypoints[imageModal.currentIndex];
                    if (wp) void copyWaypoint(wp);
                  }}
                  disabled={!gardenWaypoints[imageModal.currentIndex]}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all sm:min-w-[10rem] ${
                    copiedWaypoint === gardenWaypoints[imageModal.currentIndex]
                      ? 'bg-green-600 text-white'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 disabled:cursor-not-allowed disabled:opacity-50'
                  }`}
                >
                  {copiedWaypoint === gardenWaypoints[imageModal.currentIndex] ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <Copy className="h-4 w-4 shrink-0" />
                  )}
                  {copiedWaypoint === gardenWaypoints[imageModal.currentIndex]
                    ? t('gardenPage.sections.locations.waypointCopied')
                    : t('gardenPage.sections.locations.copyWaypoint')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JardinesPage;
