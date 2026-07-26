'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  ArrowLeft,
  Info,
  Sword,
  Zap,
  Coins,
  Map,
  Target,
  AlertTriangle,
  Star,
  TrendingUp,
  Package,
  Gift,
  List
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

const LabyrinthGuidePage = () => {
  usePageTitle('pageTitles.halloweenLabyrinth', 'Guía del Laberinto de Halloween');
  const { t, lang } = useI18n();
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [showCopyModal, setShowCopyModal] = useState<boolean>(false);
  const [itemData, setItemData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [skillData, setSkillData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [vitalityData, setVitalityData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [fireData, setFireData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [baluarteData, setBaluarteData] = useState<{name: string, icon: string} | null>(null);
  const [funcionalData, setFuncionalData] = useState<{name: string, icon: string} | null>(null);
  const [medicoData, setMedicoData] = useState<{name: string, icon: string} | null>(null);
  const [furtivoData, setFurtivoData] = useState<{name: string, icon: string} | null>(null);
  const [vampirismoData, setVampirismoData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [tercerTomoData, setTercerTomoData] = useState<{name: string, icon: string} | null>(null);
  const [primerTomoData, setPrimerTomoData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [habilidad1Data, setHabilidad1Data] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [mantraData, setMantraData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [selloData, setSelloData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [habilidad2Data, setHabilidad2Data] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [habilidad3Data, setHabilidad3Data] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [habilidad4Data, setHabilidad4Data] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [runa24836Data, setRuna24836Data] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [fuerzaData, setFuerzaData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [precisionData, setPrecisionData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [runa100148Data, setRuna100148Data] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  // const [runaVelocidadData, setRunaVelocidadData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null); // No usado actualmente
  const [relicVampirismData, setRelicVampirismData] = useState<{name: string, icon?: string, wikiUrl: string} | null>(null);
  const [relicSpeedData, setRelicSpeedData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [wintersBlessingData, setWintersBlessingData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [luckyDraketailData, setLuckyDraketailData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [luckyFirecrackerData, setLuckyFirecrackerData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [festivalGobblerBoostData, setFestivalGobblerBoostData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [guildExperienceBannerData, setGuildExperienceBannerData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [guildXPGainData, setGuildXPGainData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [experiencedEnrichmentData, setExperiencedEnrichmentData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [enlightenmentData, setEnlightenmentData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [ancientCanthanSecretData, setAncientCanthanSecretData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [restingData, setRestingData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [trait1833Name, setTrait1833Name] = useState<string>('Entrenamiento de loto');
  const [trait1833Data, setTrait1833Data] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [channeledVigorData, setChanneledVigorData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [brawlersTenacityData, setBrawlersTenacityData] = useState<{name: string, wikiUrl: string, icon: string} | null>(null);
  const [signetAgilityData, setSignetAgilityData] = useState<{name: string, wikiUrl: string, icon: string} | null>(null);
  const [stealData, setStealData] = useState<{name: string, wikiUrl: string, icon: string} | null>(null);
  const [enduranceThiefData, setEnduranceThiefData] = useState<{name: string, wikiUrl: string, icon: string} | null>(null);
  const [shadowstepData, setShadowstepData] = useState<{name: string, wikiUrl: string, icon: string} | null>(null);
  const [infiltratorsArrowData, setInfiltratorsArrowData] = useState<{name: string, wikiUrl: string, icon: string} | null>(null);
  const [spiritShardsData, setSpiritShardsData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [blackLionBoostData, setBlackLionBoostData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [experienceBoostData, setExperienceBoostData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [communalBonfireData, setCommunalBonfireData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [zampacaramelosData, setZampacaramelosData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [item20002Data, setItem20002Data] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [celebrationBoostData, setCelebrationBoostData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [strawberryGhostData, setStrawberryGhostData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [chatoyantElixirData, setChatoyantElixirData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [trickOrTreatBagsData, setTrickOrTreatBagsData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [candyCornData, setCandyCornData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [zampazaithanmelosData, setZampazaithanmelosData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [zampacoposData, setZampacoposData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [sellosEnergiaData, setSellosEnergiaData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [sellosPurificacionData, setSellosPurificacionData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [runaEstrellasData, setRunaEstrellasData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [glintData, setGlintData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [facetaElementosData, setFacetaElementosData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);
  const [facetaCaosData, setFacetaCaosData] = useState<{name: string, icon: string, wikiUrl: string} | null>(null);

  const sections = [
    { id: 'overview', label: t('halloween.labyrinth.sections.overview'), icon: Info },
    { id: 'builds', label: t('halloween.labyrinth.sections.builds'), icon: Sword },
    { id: 'routes', label: t('halloween.labyrinth.sections.routes'), icon: Map },
    { id: 'rewards', label: t('halloween.labyrinth.sections.rewards'), icon: Gift },
    { id: 'advanced', label: t('halloween.labyrinth.advanced.title'), icon: TrendingUp }
  ];

  // Función para navegar a una sección con scroll suave
  const navigateToSection = (sectionId: string, targetId?: string) => {
    setSelectedSection(sectionId);
    
    // Si hay un targetId específico, hacer scroll a ese elemento
    if (targetId) {
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          const elementPosition = element.offsetTop;
          const offsetPosition = elementPosition - 10;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100); // Pequeño delay para asegurar que la sección se haya renderizado
    }
    // Si no hay targetId, solo cambiar la sección sin hacer scroll
  };

  // Función para construir URL de wiki
  const buildWikiUrl = (itemName: string, itemType: 'item' | 'skill', itemId?: number) => {
    const normalized = (lang || 'en').toLowerCase();
    const wikiLang = normalized.startsWith('fr') ? 'fr' : normalized.startsWith('de') ? 'de' : normalized.startsWith('es') ? 'es' : 'en';
    const formattedName = (itemName || '').replace(/ /g, '_');
    
    // URLs específicas por ID de item
    if (itemId === 95421) { // Strawberry Ghost / Delicia de campamento casera
      if (wikiLang === 'fr') return 'https://wiki-fr.guildwars2.com/wiki/Friandise_de_feu_de_camp_maison';
      if (wikiLang === 'de') return 'https://wiki-de.guildwars2.com/wiki/Selbstgemachte_Lagerfeuer-Leckerei';
      if (wikiLang === 'es') return 'https://wiki.guildwars2.com/wiki/Homemade_Campfire_Treat';
      return 'https://wiki.guildwars2.com/wiki/Homemade_Campfire_Treat';
    }
    
    if (itemId === 36038) { // Trick-or-Treat Bags
      if (wikiLang === 'fr') return 'https://wiki-fr.guildwars2.com/wiki/Sac_de_bonbons';
      if (wikiLang === 'de') return 'https://wiki-de.guildwars2.com/wiki/%22S%C3%BC%C3%9Fes_oder_Saures%22-Tasche';
      if (wikiLang === 'es') return 'https://wiki.guildwars2.com/wiki/Trick-or-Treat_Bag';
      return 'https://wiki.guildwars2.com/wiki/Trick-or-Treat_Bag';
    }
    
    if (itemId === 36041) { // Candy Corn
      if (wikiLang === 'fr') return 'hhttps://wiki-fr.guildwars2.com/wiki/Morceau_de_bonbon';
      if (wikiLang === 'de') return 'https://wiki-de.guildwars2.com/wiki/St%C3%BCck_Candy-Corn';
      if (wikiLang === 'es') return 'https://wiki.guildwars2.com/wiki/Piece_of_Candy_Corn';
      return 'https://wiki.guildwars2.com/wiki/Candy_Corn';
    }
    
    // URLs específicas para el Potenciador del León Negro
    if (formattedName.toLowerCase().includes('black_lion_booster') || formattedName.toLowerCase().includes('potenciador_del_león_negro')) {
      if (wikiLang === 'fr') return 'https://wiki-fr.guildwars2.com/wiki/Augmentation_du_Lion_noir';
      if (wikiLang === 'de') return 'https://wiki-de.guildwars2.com/wiki/Schwarzl%C3%B6wen-Verst%C3%A4rker';
      if (wikiLang === 'es') return 'https://wiki.guildwars2.com/wiki/Black_Lion_Booster';
      return 'https://wiki.guildwars2.com/wiki/Black_Lion_Booster';
    }
    
    // URLs específicas para el Potenciador de Experiencia
    if (formattedName.toLowerCase().includes('experience_booster') || formattedName.toLowerCase().includes('potenciador_de_experiencia')) {
      if (wikiLang === 'fr') return 'https://wiki-fr.guildwars2.com/wiki/Augmentation_d%27exp%C3%A9rience';
      if (wikiLang === 'de') return 'https://wiki-de.guildwars2.com/wiki/Erfahrungsverst%C3%A4rker';
      if (wikiLang === 'es') return 'https://wiki.guildwars2.com/wiki/Experience_Booster_(fine)';
      return 'https://wiki.guildwars2.com/wiki/Experience_Booster_(fine)';
    }
    
    // URLs específicas para el Celebration Bonus
    if (formattedName.toLowerCase().includes('celebration_bonus') || formattedName.toLowerCase().includes('potenciador_de_celebración')) {
      if (wikiLang === 'fr') return 'https://wiki-fr.guildwars2.com/wiki/Bonus_de_c%C3%A9l%C3%A9bration';
      if (wikiLang === 'de') return 'https://wiki-de.guildwars2.com/wiki/Festtagsbonus';
      if (wikiLang === 'es') return 'https://wiki.guildwars2.com/wiki/Celebration_Bonus';
      return 'https://wiki.guildwars2.com/wiki/Celebration_Bonus';
    }
    
    // URLs específicas para el Strawberry Ghost
    if (formattedName.toLowerCase().includes('strawberry_ghost') || formattedName.toLowerCase().includes('fantasma_de_fresa')) {
      if (wikiLang === 'fr') return 'https://wiki-fr.guildwars2.com/wiki/Friandise_de_feu_de_camp_maison';
      if (wikiLang === 'de') return 'https://wiki-de.guildwars2.com/wiki/Selbstgemachte_Lagerfeuer-Leckerei';
      if (wikiLang === 'es') return 'https://wiki.guildwars2.com/wiki/Homemade_Campfire_Treat';
      return 'https://wiki.guildwars2.com/wiki/Homemade_Campfire_Treat';
    }
    
    // URLs específicas para el Chatoyant Elixir
    if (formattedName.toLowerCase().includes('chatoyant_elixir') || formattedName.toLowerCase().includes('elixir_chatoyant')) {
      if (wikiLang === 'fr') return 'https://wiki-fr.guildwars2.com/wiki/%C3%89lixir_chatoyant';
      if (wikiLang === 'de') return 'https://wiki-de.guildwars2.com/wiki/Schillernder_Elixier';
      if (wikiLang === 'es') return 'https://wiki.guildwars2.com/wiki/Chatoyant_Elixir';
      return 'https://wiki.guildwars2.com/wiki/Chatoyant_Elixir';
    }
    
    if (itemType === 'skill' || itemType === 'item') {
      if (wikiLang === 'fr') return `https://wiki-fr.guildwars2.com/wiki/${formattedName}`;
      if (wikiLang === 'de') return `https://wiki-de.guildwars2.com/wiki/${formattedName}`;
      return `https://wiki.guildwars2.com/wiki/${formattedName}`;
    }
    return `https://wiki.guildwars2.com/wiki/${formattedName}`;
  };

  // Trait 1833 (Lotus Training): nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Lotus Training',
      de: 'Lotus-Training',
      es: 'Entrenamiento de loto',
      fr: 'Initiation du lotus',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Lotus_Training',
      es: 'https://wiki-es.guildwars2.com/wiki/Entrenamiento_de_loto',
      de: 'https://wiki-de.guildwars2.com/wiki/Lotus-Training',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Initiation_du_lotus',
    };
    const icon = 'https://wiki.guildwars2.com/images/e/ea/Lotus_Training.png';
    const name = nameByLang[langKey] || nameByLang.en;
    const wikiUrl = wikiByLang[langKey] || wikiByLang.en;
    setTrait1833Name(name);
    setTrait1833Data({ name, icon, wikiUrl });
  }, [lang]);

  // Obtener datos de Vigor canalizado (skill 30400) según idioma actual (icono fijo + nombre mapeado)
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const fixedIcon = 'https://wiki.guildwars2.com/images/thumb/a/a1/Channeled_Vigor.png/48px-Channeled_Vigor.png';
    const nameByLang: Record<string, string> = {
      en: 'Channeled Vigor',
      de: 'Kanalisierter Elan',
      es: 'Vigor canalizado',
      fr: 'Vigueur canalisée'
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Channeled_Vigor',
      es: 'https://wiki.guildwars2.com/wiki/Channeled_Vigor',
      de: 'https://wiki-de.guildwars2.com/wiki/Kanalisierter_Elan',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Vigueur_canalisée'
    };
    const name = nameByLang[langKey] || nameByLang.en;
    const wikiUrl = wikiByLang[langKey] || wikiByLang.en;
    setChanneledVigorData({
      name,
      icon: fixedIcon,
      wikiUrl
    });
  }, [lang]);

  // La tenacidad del luchador (Brawler's Tenacity): nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: "Brawler's Tenacity",
      de: 'Hartnäckigkeit des Raufbolds',
      es: 'Tenacidad de pendenciero',
      fr: 'Ténacité du bagarreur'
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Brawler%27s_Tenacity',
      es: 'https://wiki.guildwars2.com/wiki/Brawler%27s_Tenacity',
      de: 'https://wiki-de.guildwars2.com/wiki/Hartn%C3%A4ckigkeit_des_Raufbolds',
      fr: 'https://wiki-fr.guildwars2.com/wiki/T%C3%A9nacit%C3%A9_du_bagarreur'
    };
    const icon = 'https://wiki.guildwars2.com/images/8/89/Brawler%27s_Tenacity.png';
    setBrawlersTenacityData({ name: nameByLang[langKey], wikiUrl: wikiByLang[langKey], icon });
  }, [lang]);

  // Sello de Agilidad (Signet of Agility): nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Signet of Agility',
      de: 'Siegel der Beweglichkeit',
      es: 'Sello de agilidad',
      fr: "Signe d'agilité",
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Signet_of_Agility',
      es: 'https://wiki.guildwars2.com/wiki/Signet_of_Agility',
      de: 'https://wiki-de.guildwars2.com/wiki/Siegel_der_Beweglichkeit',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Signe_d%27agilit%C3%A9',
    };
    const icon = 'https://wiki.guildwars2.com/images/thumb/1/1d/Signet_of_Agility.png/48px-Signet_of_Agility.png';
    setSignetAgilityData({ name: nameByLang[langKey], wikiUrl: wikiByLang[langKey], icon });
  }, [lang]);

  // Reliquia de Velocidad (ID 100148): icono desde API + wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const apiLang = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Relic_of_Speed',
      es: 'https://wiki.guildwars2.com/wiki/Relic_of_Speed',
      de: 'https://wiki-de.guildwars2.com/wiki/Relikt_der_Geschwindigkeit',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Relique_de_vitesse',
    };
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    fetch(`https://api.guildwars2.com/v2/items/100148?lang=${apiLang}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setRelicSpeedData({ name: d.name, icon: d.icon, wikiUrl: wikiByLang[langKey] });
      })
      .catch(() => {});
  }, [lang]);

  // Reliquia de Vampirismo (ID 100676): nombre y wiki por idioma (icono opcional)
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Relic of Vampirism',
      de: 'Relikt des Vampirismus',
      es: 'Reliquia de vampirismo',
      fr: 'Relique de vampirisme',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Relic_of_Vampirism',
      es: 'https://wiki.guildwars2.com/wiki/Relic_of_Vampirism',
      de: 'https://wiki-de.guildwars2.com/wiki/Relikt_des_Vampirismus',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Relique_de_vampirisme',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    setRelicVampirismData({ name, wikiUrl });
    // Intentar obtener icono desde la API de items por ID (100676)
    const apiLang = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    fetch(`https://api.guildwars2.com/v2/items/100676?lang=${apiLang}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.icon === 'string' && d.icon) {
          setRelicVampirismData(prev => prev ? { ...prev, icon: d.icon } : { name, wikiUrl, icon: d.icon });
        }
      })
      .catch(() => {});
  }, [lang]);

  // Winter's Blessing (ID 77656): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Winter\'s Blessing',
      de: 'Wintersegnung',
      es: 'Bendición Invernal',
      fr: 'Bénédiction hivernale',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Winter%27s_Blessing',
      es: 'https://wiki.guildwars2.com/wiki/Winter%27s_Blessing',
      de: 'https://wiki-de.guildwars2.com/wiki/Wintersegnung',
      fr: 'https://wiki-fr.guildwars2.com/wiki/B%C3%A9n%C3%A9diction_hivernale',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    setWintersBlessingData({ name, wikiUrl, icon: '' });
    // Intentar obtener icono desde la API de items por ID (77656)
    const apiLang = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    fetch(`https://api.guildwars2.com/v2/items/77656?lang=${apiLang}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.icon === 'string' && d.icon) {
          setWintersBlessingData(prev => prev ? { ...prev, icon: d.icon } : { name, wikiUrl, icon: d.icon });
        }
      })
      .catch(() => {});
  }, [lang]);

  // Lucky Draketail (ID 77750): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Lucky Draketail',
      de: 'Glücks-Lindwurmschwanz',
      es: 'Don de año nuevo',
      fr: 'Queue de drake porte-bonheur',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Lucky_Draketail',
      es: 'https://wiki.guildwars2.com/wiki/Lucky_Draketail',
      de: 'https://wiki-de.guildwars2.com/wiki/Gl%C3%BCcks-Lindwurmschwanz',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Queue_de_drake_porte-bonheur',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    setLuckyDraketailData({ name, wikiUrl, icon: '' });
    // Intentar obtener icono desde la API de items por ID (77750)
    const apiLang = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    fetch(`https://api.guildwars2.com/v2/items/77750?lang=${apiLang}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.icon === 'string' && d.icon) {
          setLuckyDraketailData(prev => prev ? { ...prev, icon: d.icon } : { name, wikiUrl, icon: d.icon });
        }
      })
      .catch(() => {});
  }, [lang]);

  // Lucky Firecracker (ID 77762): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Lucky Firecracker',
      de: 'Glücksfeuerwerkskörper',
      es: 'Bonificación de año nuevo',
      fr: 'Pétard porte-bonheur',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Lucky_Firecracker',
      es: 'https://wiki.guildwars2.com/wiki/Lucky_Firecracker',
      de: 'https://wiki-de.guildwars2.com/wiki/Gl%C3%BCcksfeuerwerksk%C3%B6rper',
      fr: 'https://wiki-fr.guildwars2.com/wiki/P%C3%A9tard_porte-bonheur',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    setLuckyFirecrackerData({ name, wikiUrl, icon: '' });
    // Intentar obtener icono desde la API de items por ID (77762)
    const apiLang = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    fetch(`https://api.guildwars2.com/v2/items/77762?lang=${apiLang}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.icon === 'string' && d.icon) {
          setLuckyFirecrackerData(prev => prev ? { ...prev, icon: d.icon } : { name, wikiUrl, icon: d.icon });
        }
      })
      .catch(() => {});
  }, [lang]);

  // Festival Gobbler Boost (Effect ID 60607): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Festival Gobbler Boost',
      de: 'Fest-Fresser-Schub',
      es: 'Potenciador de zampador de festival',
      fr: 'Amélioration goinfre du festival',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Festival_Gobbler_Boost',
      es: 'https://wiki.guildwars2.com/wiki/Festival_Gobbler_Boost',
      de: 'https://wiki-de.guildwars2.com/wiki/Fest-Fresser-Schub',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Amélioration_goinfre_du_festival',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    // Usar el icono fijo de Dragon's Rage ya que es el icono oficial del efecto
    const icon = 'https://wiki.guildwars2.com/images/a/aa/Dragon%27s_Rage.png';
    setFestivalGobblerBoostData({ name, wikiUrl, icon });
  }, [lang]);

  // Guild Experience Banner Bonus: nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Guild Experience Banner Bonus',
      de: 'Gilden-EP-Banner-Bonus',
      es: 'Potenciador de estandarte de experiencia del clan',
      fr: 'Bannière d\'expérience de guilde',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Guild_Experience_Banner_Bonus',
      es: 'https://wiki.guildwars2.com/wiki/Guild_Experience_Banner_Bonus',
      de: 'https://wiki-de.guildwars2.com/wiki/Gilden-EP-Banner-Bonus',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Bannière_d%27expérience_de_guilde',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    // Usar el icono fijo del estandarte de experiencia
    const icon = 'https://wiki.guildwars2.com/images/f/f4/5_Exp_Public_Banner.png';
    setGuildExperienceBannerData({ name, wikiUrl, icon });
  }, [lang]);

  // Guild XP Gain: nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Guild XP Gain',
      de: 'Gilden-Verstärkung: EP-Gewinn',
      es: 'Ganancia de PE de clan',
      fr: 'Gain d\'EXP de guilde',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Guild_XP_Gain',
      es: 'https://wiki.guildwars2.com/wiki/Guild_XP_Gain',
      de: 'https://wiki-de.guildwars2.com/wiki/Gilden-Verst%C3%A4rkung:_EP-Gewinn',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Gain_d%27EXP_de_guilde',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    // Usar el icono fijo del tónico de dolyak
    const icon = 'https://wiki.guildwars2.com/images/f/fe/Endless_Gift_Dolyak_Tonic.png';
    setGuildXPGainData({ name, wikiUrl, icon });
  }, [lang]);

  // Experienced Enrichment (ID 39330): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Experienced_Enrichment',
      es: 'https://wiki.guildwars2.com/wiki/Experienced_Enrichment',
      de: 'https://wiki-de.guildwars2.com/wiki/Erfahrungsanreicherung',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Enrichissement_d%27expérience',
    };
    const wikiUrl = wikiByLang[langKey];
    setExperiencedEnrichmentData({ name: '', wikiUrl, icon: '' });
    // Intentar obtener nombre e icono desde la API de items por ID (39330)
    const apiLang = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    fetch(`https://api.guildwars2.com/v2/items/39330?lang=${apiLang}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.name === 'string' && d.name && typeof d.icon === 'string' && d.icon) {
          setExperiencedEnrichmentData({ name: d.name, wikiUrl, icon: d.icon });
        }
      })
      .catch(() => {});
  }, [lang]);

  // Enlightenment: nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Enlightenment',
      de: 'Erleuchtung',
      es: 'Iluminación',
      fr: 'Illumination',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Enlightenment',
      es: 'https://wiki.guildwars2.com/wiki/Enlightenment',
      de: 'https://wiki-de.guildwars2.com/wiki/Erleuchtung_(Effekt)',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Illumination',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    // Usar un icono fijo para Enlightenment (puedes cambiar este por el icono correcto)
    const icon = 'https://wiki.guildwars2.com/images/f/fa/Enlightenment.png';
    setEnlightenmentData({ name, wikiUrl, icon });
  }, [lang]);

  // Ancient Canthan Secret: nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Ancient Canthan Secret',
      de: 'Alter Kantha-Tempel-Geheimnis',
      es: 'Secreto ancestral cantha',
      fr: 'Secret canthien ancien',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Ancient_Canthan_Secret_(effect)',
      es: 'https://wiki.guildwars2.com/wiki/Ancient_Canthan_Secret_(effect)',
      de: 'https://wiki-de.guildwars2.com/wiki/Alter_Kantha-Tempel-Geheimnis_(Effekt)',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Secret_canthien_ancien_(effet)',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    // Usar el icono de Enlightenment ya que es el mismo efecto visual
    const icon = 'https://wiki.guildwars2.com/images/f/fa/Enlightenment.png';
    setAncientCanthanSecretData({ name, wikiUrl, icon });
  }, [lang]);

  // Resting: nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Resting',
      de: 'Ausruhen',
      es: 'Descanso',
      fr: 'Repos',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Resting',
      es: 'https://wiki.guildwars2.com/wiki/Resting',
      de: 'https://wiki-de.guildwars2.com/wiki/Ausruhen',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Repos',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    // Usar el icono de Well Rested
    const icon = 'https://wiki.guildwars2.com/images/3/32/Well_Rested.png';
    setRestingData({ name, wikiUrl, icon });
  }, [lang]);

  // ZampaZaithanmelos (ID 93704): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Zhaitaffy Gobbler',
      de: 'Zhaikritze-Fresser',
      es: 'ZampaZaithanmelos',
      fr: 'Zhaitaffy Gobbler',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Zhaitaffy_Gobbler',
      es: 'https://wiki.guildwars2.com/wiki/Zhaitaffy_Gobbler',
      de: ' https://wiki-de.guildwars2.com/wiki/Zhaikritze-Fresser',
      fr: 'https://wiki.guildwars2.com/wiki/Zhaitaffy_Gobbler',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    setZampazaithanmelosData({ name, wikiUrl, icon: '' });
    // Intentar obtener icono desde la API de items por ID (93704)
    const apiLang = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    fetch(`https://api.guildwars2.com/v2/items/93704?lang=${apiLang}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.icon === 'string' && d.icon) {
          setZampazaithanmelosData(prev => prev ? { ...prev, icon: d.icon } : { name, wikiUrl, icon: d.icon });
        }
      })
      .catch(() => {});
  }, [lang]);

  // Zampacopos (ID 92585): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Snowflake Gobbler',
      de: 'Schneeflocken-Fresser',
      es: 'Zampacopos',
      fr: 'Gobe-flocons',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Snowflake_Gobbler',
      es: 'https://wiki.guildwars2.com/wiki/Snowflake_Gobbler ',
      de: 'https://wiki-de.guildwars2.com/wiki/Schneeflocken-Fresser ',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Gobe-flocons',
    };
    const name = nameByLang[langKey];
    const wikiUrl = wikiByLang[langKey];
    setZampacoposData({ name, wikiUrl, icon: '' });
    // Intentar obtener icono desde la API de items por ID (92585)
    const apiLang = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    fetch(`https://api.guildwars2.com/v2/items/92585?lang=${apiLang}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.icon === 'string' && d.icon) {
          setZampacoposData(prev => prev ? { ...prev, icon: d.icon } : { name, wikiUrl, icon: d.icon });
        }
      })
      .catch(() => {});
  }, [lang]);

  // Robar (Steal): nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Steal',
      de: 'Stehlen',
      es: 'Robar',
      fr: 'Larcin',
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Steal',
      es: 'https://wiki.guildwars2.com/wiki/Steal',
      de: 'https://wiki-de.guildwars2.com/wiki/Stehlen',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Larcin',
    };
    const icon = 'https://wiki.guildwars2.com/images/9/92/Steal.png';
    setStealData({ name: nameByLang[langKey], wikiUrl: wikiByLang[langKey], icon });
  }, [lang]);

  // Ladrón de resistencia (Endurance Thief): nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Endurance Thief',
      de: 'Ausdauer-Dieb',
      es: 'Ladrón de aguante',
      fr: "Voleur d'endurance",
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Endurance_Thief',
      es: 'https://wiki.guildwars2.com/wiki/Endurance_Thief',
      de: 'https://wiki-de.guildwars2.com/wiki/Ausdauer-Dieb',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Voleur_d%27endurance',
    };
    const icon = 'https://wiki.guildwars2.com/images/4/46/Endurance_Thief.png';
    setEnduranceThiefData({ name: nameByLang[langKey], wikiUrl: wikiByLang[langKey], icon });
  }, [lang]);

  // Paso de sombra (Shadowstep): nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: 'Shadowstep',
      de: 'Schattenschritt (Dieb)',
      es: 'Paso sombrío',
      fr: "Foulée de l'ombre",
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Shadowstep',
      es: 'https://wiki.guildwars2.com/wiki/Shadowstep',
      de: 'https://wiki-de.guildwars2.com/wiki/Schattenschritt_(Dieb)',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Foul%C3%A9e_de_l%27ombre',
    };
    const icon = 'https://wiki.guildwars2.com/images/2/25/Shadowstep.png';
    setShadowstepData({ name: nameByLang[langKey], wikiUrl: wikiByLang[langKey], icon });
  }, [lang]);

  // Flecha del infiltrado (Infiltrator's Arrow): nombre, icono fijo y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      en: "Infiltrator's Arrow",
      de: 'Pfeil des Infiltrators',
      es: 'Flecha del infiltrado',
      fr: "Flèche de l'infiltré",
    };
    const wikiByLang: Record<string, string> = {
      en: 'https://wiki.guildwars2.com/wiki/Infiltrator%27s_Arrow',
      es: 'https://wiki.guildwars2.com/wiki/Infiltrator%27s_Arrow',
      de: 'https://wiki-de.guildwars2.com/wiki/Pfeil_des_Infiltrators',
      fr: 'https://wiki-fr.guildwars2.com/wiki/Fl%C3%A8che_de_l%27infiltr%C3%A9',
    };
    const icon = 'https://wiki.guildwars2.com/images/c/c7/Infiltrator%27s_Arrow.png';
    setInfiltratorsArrowData({ name: nameByLang[langKey], wikiUrl: wikiByLang[langKey], icon });
  }, [lang]);

  // Función para construir URL de wiki de sellos
  const buildSigilWikiUrl = (itemType: 'vitality' | 'fire' | 'vampirismo' | 'velocidad' | 'tomo-justicia' | 'epilogo-cenizas'): string => {
    if (itemType === 'vitality') {
      if (lang === 'es') {
        return `https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina`;
      } else if (lang === 'fr') {
        return `https://wiki-fr.guildwars2.com/wiki/Cachet_d%27endurance_sup%C3%A9rieur`;
      } else if (lang === 'de') {
        return `https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_der_Ausdauer`;
      } else {
        return `https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina`;
      }
    } else if (itemType === 'fire') {
      if (lang === 'es') {
        return `https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire`;
      } else if (lang === 'fr') {
        return `https://wiki-fr.guildwars2.com/wiki/Cachet_de_feu_sup%C3%A9rieur`;
      } else if (lang === 'de') {
        return `https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_des_Feuers`;
      } else {
        return `https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire`;
      }
    } else if (itemType === 'vampirismo') {
      if (lang === 'es') {
        return `https://wiki.guildwars2.com/wiki/Superior_Rune_of_Vampirism`;
      } else if (lang === 'fr') {
        return `https://wiki-fr.guildwars2.com/wiki/Rune_sup%C3%A9rieure_de_vampirisme`;
      } else if (lang === 'de') {
        return `https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegene_Rune_des_Vampirismus`;
      } else {
        return `https://wiki.guildwars2.com/wiki/Superior_Rune_of_Vampirism`;
      }
    } else if (itemType === 'velocidad') {
      if (lang === 'es') {
        return `https://wiki.guildwars2.com/wiki/Relic_of_Vampirism`;
      } else if (lang === 'fr') {
        return `https://wiki-fr.guildwars2.com/wiki/Relique_de_vampirisme`;
      } else if (lang === 'de') {
        return `https://wiki-de.guildwars2.com/wiki/Relikt_des_Vampirismus`;
      } else {
        return `https://wiki.guildwars2.com/wiki/Relic_of_Vampirism`;
      }
    } else if (itemType === 'tomo-justicia') {
      if (lang === 'es') {
        return `https://wiki.guildwars2.com/wiki/Tome_of_Justice`;
      } else if (lang === 'fr') {
        return `https://wiki-fr.guildwars2.com/wiki/Grimoire_de_justice`;
      } else if (lang === 'de') {
        return `https://wiki-de.guildwars2.com/wiki/Foliant_der_Gerechtigkeit`;
      } else {
        return `https://wiki.guildwars2.com/wiki/Tome_of_Justice`;
      }
    } else if (itemType === 'epilogo-cenizas') {
      if (lang === 'es') {
        return `https://wiki.guildwars2.com/wiki/Epilogue:_Ashes_of_the_Just`;
      } else if (lang === 'fr') {
        return `https://wiki-fr.guildwars2.com/wiki/%C3%89pilogue_:_Les_cendres_des_justes`;
      } else if (lang === 'de') {
        return `https://wiki-de.guildwars2.com/wiki/Epilog:_Die_Asche_der_Gerechten`;
      } else {
        return `https://wiki.guildwars2.com/wiki/Epilogue:_Ashes_of_the_Just`;
      }
    }
    // Fallback por defecto
    return `https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina`;
  };

  // Función para obtener nombres traducidos de habilidades (comentada - no se usa actualmente)
  // const getTranslatedName = (itemType: 'epilogo-cenizas'): string => {
  //   if (itemType === 'epilogo-cenizas') {
  //     if (lang === 'es') {
  //       return 'Epílogo: Las cenizas de los justes';
  //     } else if (lang === 'fr') {
  //       return 'Épilogue : Les cendres des justes';
  //     } else if (lang === 'de') {
  //       return 'Epilog: Die Asche der Gerechten';
  //     } else {
  //       return 'Epilogue: Ashes of the Just';
  //     }
  //   }
  //   return '';
  // };

  // Función para obtener datos del item
  const fetchItemData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/88118?lang=${lang}`);
      const data = await response.json();
      setItemData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item')
      });
    } catch {
      // Error fetching item data
    }
  };

  // Función para obtener datos de la skill
  const fetchSkillData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/5973?lang=${lang}`);
      const data = await response.json();
      setSkillData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'skill')
      });
    } catch {
      // Error fetching skill data
    }
  };

  // Función para obtener datos de vitalidad
  const fetchVitalityData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/24592?lang=${lang}`);
      const data = await response.json();
      setVitalityData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildSigilWikiUrl('vitality')
      });
    } catch {
      // Error fetching vitality data
    }
  };

  // Función para obtener datos de fuego
  const fetchFireData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/24548?lang=${lang}`);
      const data = await response.json();
      setFireData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildSigilWikiUrl('fire')
      });
    } catch {
      // Error fetching fire data
    }
  };

  // Función para obtener datos de Giro baluarte
  const fetchBaluarteData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/30101?lang=${lang}`);
      const data = await response.json();
      setBaluarteData({
        name: data.name,
        icon: data.icon
      });
    } catch {
      // Error fetching baluarte data
    }
  };

  // Función para obtener datos de Giro funcional
  const fetchFuncionalData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/56920?lang=${lang}`);
      const data = await response.json();
      setFuncionalData({
        name: data.name,
        icon: data.icon
      });
    } catch {
      // Error fetching funcional data
    }
  };

  // Función para obtener datos de Giro medico
  const fetchMedicoData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/30357?lang=${lang}`);
      const data = await response.json();
      setMedicoData({
        name: data.name,
        icon: data.icon
      });
    } catch {
      // Error fetching medico data
    }
  };

  // Función para obtener datos de Giro furtivo
  const fetchFurtivoData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/30815?lang=${lang}`);
      const data = await response.json();
      setFurtivoData({
        name: data.name,
        icon: data.icon
      });
    } catch {
      // Error fetching furtivo data
    }
  };

  // Función para obtener datos de Runa de Vampirismo
  const fetchVampirismoData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/24711?lang=${lang}`);
      const data = await response.json();
      setVampirismoData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildSigilWikiUrl('vampirismo')
      });
    } catch {
      // Error fetching vampirismo data
    }
  };


  // Función para obtener datos del tercer tomo
  const fetchTercerTomoData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/42259?lang=${lang}`);
      const data = await response.json();
      setTercerTomoData({
        name: data.name,
        icon: data.icon
      });
    } catch {
      // Error fetching tercer tomo data
    }
  };

  // Función para obtener datos del primer tomo
  const fetchPrimerTomoData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/44364?lang=${lang}`);
      const data = await response.json();
      setPrimerTomoData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildSigilWikiUrl('tomo-justicia')
      });
    } catch {
      // Error fetching primer tomo data
    }
  };

  const fetchHabilidad1Data = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/10219?lang=${lang}`);
      const data = await response.json();
      const normalized = (lang || 'en').toLowerCase();
      const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
      const wikiByLang: Record<string, string> = {
        en: 'https://wiki.guildwars2.com/wiki/Spatial_Surge',
        es: 'https://wiki.guildwars2.com/wiki/Spatial_Surge',
        de: 'https://wiki-de.guildwars2.com/wiki/R%C3%A4umliche_Welle',
        fr: 'https://wiki-fr.guildwars2.com/wiki/Renforcement_spatial'
      };
      setHabilidad1Data({
        name: data.name,
        icon: data.icon,
        wikiUrl: wikiByLang[langKey]
      });
    } catch {
      // Error fetching habilidad 1 data
    }
  };

  const fetchMantraData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/10211?lang=${lang}`);
      const data = await response.json();
      const normalized = (lang || 'en').toLowerCase();
      const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
      const wikiByLang: Record<string, string> = {
        en: 'https://wiki.guildwars2.com/wiki/Mantra_of_Pain',
        es: 'https://wiki.guildwars2.com/wiki/Mantra_of_Pain',
        de: 'https://wiki-de.guildwars2.com/wiki/Mantra_der_Schmerzen',
        fr: 'https://wiki-fr.guildwars2.com/wiki/Mantra_de_douleur'
      };
      setMantraData({
        name: data.name,
        icon: data.icon,
        wikiUrl: wikiByLang[langKey]
      });
    } catch {
      // Error fetching mantra data
    }
  };

  const fetchSelloData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/10236?lang=${lang}`);
      const data = await response.json();
      const normalized = (lang || 'en').toLowerCase();
      const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
      const wikiByLang: Record<string, string> = {
        en: 'https://wiki.guildwars2.com/wiki/Signet_of_Inspiration',
        es: 'https://wiki.guildwars2.com/wiki/Signet_of_Inspiration',
        de: 'https://wiki-de.guildwars2.com/wiki/Siegel_der_Inspiration',
        fr: 'https://wiki-fr.guildwars2.com/wiki/Signe_d%27inspiration'
      };
      setSelloData({
        name: data.name,
        icon: data.icon,
        wikiUrl: wikiByLang[langKey]
      });
    } catch {
      // Error fetching sello data
    }
  };

  const fetchHabilidad2Data = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/10333?lang=${lang}`);
      const data = await response.json();
      const normalized = (lang || 'en').toLowerCase();
      const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
      const wikiByLang: Record<string, string> = {
        en: 'https://wiki.guildwars2.com/wiki/Mirror_Blade',
        es: 'https://wiki.guildwars2.com/wiki/Mirror_Blade',
        de: 'https://wiki-de.guildwars2.com/wiki/Spiegelklinge',
        fr: 'https://wiki-fr.guildwars2.com/wiki/Lame_miroir'
      };
      setHabilidad2Data({
        name: data.name,
        icon: data.icon,
        wikiUrl: wikiByLang[langKey]
      });
    } catch {
      // Error fetching habilidad 2 data
    }
  };

  const fetchHabilidad3Data = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/10218?lang=${lang}`);
      const data = await response.json();
      const normalized = (lang || 'en').toLowerCase();
      const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
      const wikiByLang: Record<string, string> = {
        en: 'https://wiki.guildwars2.com/wiki/Mind_Stab',
        es: 'https://wiki.guildwars2.com/wiki/Mind_Stab',
        de: 'https://wiki-de.guildwars2.com/wiki/Gedankenstich',
        fr: 'https://wiki-fr.guildwars2.com/wiki/Surin_mental'
      };
      setHabilidad3Data({
        name: data.name,
        icon: data.icon,
        wikiUrl: wikiByLang[langKey]
      });
    } catch {
      // Error fetching habilidad 3 data
    }
  };

  const fetchHabilidad4Data = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/skills/10221?lang=${lang}`);
      const data = await response.json();
      const normalized = (lang || 'en').toLowerCase();
      const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
      const wikiByLang: Record<string, string> = {
        en: 'https://wiki.guildwars2.com/wiki/Phantasmal_Berserker',
        es: 'https://wiki.guildwars2.com/wiki/Phantasmal_Berserker',
        de: 'https://wiki-de.guildwars2.com/wiki/Tr%C3%BCgerischer_Berserker',
        fr: 'https://wiki-fr.guildwars2.com/wiki/Berserker_fantasmagorique'
      };
      setHabilidad4Data({
        name: data.name,
        icon: data.icon,
        wikiUrl: wikiByLang[langKey]
      });
    } catch {
      // Error fetching habilidad 4 data
    }
  };

  const fetchRuna24836Data = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/24836?lang=${lang}`);
      const data = await response.json();
      setRuna24836Data({
        name: data.name,
        icon: data.icon,
        wikiUrl: `https://wiki.guildwars2.com/wiki/${data.name.replace(/ /g, '_')}`
      });
    } catch {
      // Error fetching runa 24836 data
    }
  };

  const fetchFuerzaData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/24615?lang=${lang}`);
      const data = await response.json();
      setFuerzaData({
        name: data.name,
        icon: data.icon,
        wikiUrl: `https://wiki.guildwars2.com/wiki/${data.name.replace(/ /g, '_')}`
      });
    } catch {
      // Error fetching fuerza data
    }
  };

  const fetchPrecisionData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/24562?lang=${lang}`);
      const data = await response.json();
      setPrecisionData({
        name: data.name,
        icon: data.icon,
        wikiUrl: `https://wiki.guildwars2.com/wiki/${data.name.replace(/ /g, '_')}`
      });
    } catch {
      // Error fetching precision data
    }
  };

  const fetchRuna100148Data = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/100148?lang=${lang}`);
      const data = await response.json();
      setRuna100148Data({
        name: data.name,
        icon: data.icon,
        wikiUrl: `https://wiki.guildwars2.com/wiki/${data.name.replace(/ /g, '_')}`
      });
    } catch {
      // Error fetching runa 100148 data
    }
  };

  // Función para obtener datos de Runa de Velocidad (comentada - no se usa actualmente)
  const fetchRunaVelocidadData = async () => {
    try {
      // const response = await fetch(`https://api.guildwars2.com/v2/items/100148?lang=${lang}`);
      // const data = await response.json();
      // runaVelocidadData preparado pero no usado actualmente
      // setRunaVelocidadData({
      //   name: data.name,
      //   icon: data.icon,
      //   wikiUrl: buildSigilWikiUrl('velocidad')
      // });
    } catch {
      // Error fetching runa velocidad data
    }
  };

  // Función para obtener datos de Esquirlas Espirituales
  const fetchSpiritShardsData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/69910?lang=${lang}`);
      const data = await response.json();
      setSpiritShardsData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item')
      });
    } catch {
      // Error fetching spirit shards data
    }
  };

  // Función para obtener datos del Potenciador del León Negro
  const fetchBlackLionBoostData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/82060?lang=${lang}`);
      const data = await response.json();
      setBlackLionBoostData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item')
      });
    } catch {
      // Error fetching black lion boost data
    }
  };

  // Función para obtener datos del Potenciador de Experiencia
  const fetchExperienceBoostData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/19997?lang=${lang}`);
      const data = await response.json();
      setExperienceBoostData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item')
      });
    } catch {
      // Error fetching experience boost data
    }
  };

  // Función para obtener datos del Communal Boost Bonfire
  const fetchCommunalBonfireData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/41741?lang=${lang}`);
      const data = await response.json();
      setCommunalBonfireData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item')
      });
    } catch {
      // Error fetching communal bonfire data
    }
  };

  // Función para obtener datos del Zampacaramelos
  const fetchZampacaramelosData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/67393?lang=${lang}`);
      const data = await response.json();
      setZampacaramelosData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item')
      });
    } catch {
      // Error fetching zampacaramelos data
    }
  };

  // Función para obtener datos del item 20002
  const fetchItem20002Data = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/20002?lang=${lang}`);
      const data = await response.json();
      setItem20002Data({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item')
      });
    } catch {
      // Error fetching item 20002 data
    }
  };

  // Función para obtener datos del Potenciador de Celebración
  const fetchCelebrationBoostData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/67836?lang=${lang}`);
      const data = await response.json();
      setCelebrationBoostData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item')
      });
    } catch {
      // Error fetching celebration boost data
    }
  };

  // Función para obtener datos del Delicia de campamento casera
  const fetchStrawberryGhostData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/95421?lang=${lang}`);
      const data = await response.json();
      setStrawberryGhostData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item', 95421)
      });
    } catch {
      // Error fetching Delicia de campamento casera data
    }
  };

  // Función para obtener datos del Chatoyant Elixir
  const fetchChatoyantElixirData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/93241?lang=${lang}`);
      const data = await response.json();
      setChatoyantElixirData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item')
      });
    } catch {
      // Error fetching chatoyant elixir data
    }
  };

  // Función para obtener datos de Trick-or-Treat Bags
  const fetchTrickOrTreatBagsData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/36038?lang=${lang}`);
      const data = await response.json();
      setTrickOrTreatBagsData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item', 36038)
      });
    } catch {
      // Error fetching trick or treat bags data
    }
  };

  // Función para obtener datos de Candy Corn
  const fetchCandyCornData = async () => {
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/items/36041?lang=${lang}`);
      const data = await response.json();
      setCandyCornData({
        name: data.name,
        icon: data.icon,
        wikiUrl: buildWikiUrl(data.name, 'item', 36041)
      });
    } catch {
      // Error fetching candy corn data
    }
  };

  // Sellos de energía (ID 24607): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      'es': 'Sello superior de energía',
      'en': 'Superior Sigil of Energy',
      'fr': 'Cachet d\'énergie supérieur',
      'de': 'Überlegenes Sigill der Energie'
    };
    const wikiByLang: Record<string, string> = {
      'es': 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Energy',
      'en': 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Energy',
      'fr': 'https://wiki-fr.guildwars2.com/wiki/Cachet_d%27%C3%A9nergie_sup%C3%A9rieur',
      'de': 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_der_Reinigung'
    };
    
    setSellosEnergiaData({
      name: nameByLang[langKey] || nameByLang['en'],
      icon: 'https://wiki.guildwars2.com/images/0/0f/Superior_Sigil_of_Energy.png',
      wikiUrl: wikiByLang[langKey] || wikiByLang['en']
    });
  }, [lang]);

  // Sello superior de purificación (ID 67340): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      'es': 'Sello superior de purificación',
      'en': 'Superior Sigil of Cleansing',
      'fr': 'Cachet de purification supérieur',
      'de': 'Überlegenes Sigill der Reinigung'
    };
    const wikiByLang: Record<string, string> = {
      'es': 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Cleansing',
      'en': 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Cleansing',
      'fr': 'https://wiki-fr.guildwars2.com/wiki/Cachet_de_purification_sup%C3%A9rieur',
      'de': 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_der_Reinigung'
    };
    
    setSellosPurificacionData({
      name: nameByLang[langKey] || nameByLang['en'],
      icon: 'https://wiki.guildwars2.com/images/e/e7/Superior_Sigil_of_Cleansing.png',
      wikiUrl: wikiByLang[langKey] || wikiByLang['en']
    });
  }, [lang]);

  // Runa superior de las estrellas (ID 85713): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      'es': 'Runa superior de las estrellas',
      'en': 'Superior Rune of the Stars',
      'fr': 'Rune des étoiles supérieure',
      'de': 'Überlegene Rune der Sterne'
    };
    const wikiByLang: Record<string, string> = {
      'es': 'https://wiki.guildwars2.com/wiki/Superior_Rune_of_the_Stars',
      'en': 'https://wiki.guildwars2.com/wiki/Superior_Rune_of_the_Stars',
      'fr': 'https://wiki-fr.guildwars2.com/wiki/Rune_des_%C3%A9toiles_sup%C3%A9rieure',
      'de': 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegene_Rune_der_Sterne'
    };
    
    setRunaEstrellasData({
      name: nameByLang[langKey] || nameByLang['en'],
      icon: 'https://wiki.guildwars2.com/images/8/86/Superior_Rune_of_the_Stars.png',
      wikiUrl: wikiByLang[langKey] || wikiByLang['en']
    });
  }, [lang]);

  // Postura de dragona legendaria (ID 28085): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      'es': 'Postura de dragona legendaria',
      'en': 'Legendary Dragon Stance',
      'fr': 'Posture du Dragon légendaire',
      'de': 'Legendäre Drachenform'
    };
    const wikiByLang: Record<string, string> = {
      'es': 'https://wiki.guildwars2.com/wiki/Legendary_Dragon_Stance',
      'en': 'https://wiki.guildwars2.com/wiki/Legendary_Dragon_Stance',
      'fr': 'https://wiki-fr.guildwars2.com/wiki/Posture_du_Dragon_l%C3%A9gendaire',
      'de': 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegene_Rune_der_Sterne'
    };
    
    setGlintData({
      name: nameByLang[langKey] || nameByLang['en'],
      icon: 'https://wiki-es.guildwars2.com/images/0/0e/Postura_de_dragona_legendaria.png',
      wikiUrl: wikiByLang[langKey] || wikiByLang['en']
    });
  }, [lang]);

  // Faceta de los elementos (ID 27014): nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      'es': 'Faceta de los elementos',
      'en': 'Facet of Elements',
      'fr': 'Facette des éléments',
      'de': 'Aspekt der Elemente'
    };
    const wikiByLang: Record<string, string> = {
      'es': 'https://wiki.guildwars2.com/wiki/Facet_of_Elements',
      'en': 'https://wiki.guildwars2.com/wiki/Facet_of_Elements',
      'fr': 'https://wiki-fr.guildwars2.com/wiki/Facette_des_%C3%A9l%C3%A9ments',
      'de': 'https://wiki-de.guildwars2.com/wiki/Aspekt_der_Elemente'
    };
    
    setFacetaElementosData({
      name: nameByLang[langKey] || nameByLang['en'],
      icon: 'https://wiki.guildwars2.com/images/c/ce/Facet_of_Elements.png',
      wikiUrl: wikiByLang[langKey] || wikiByLang['en']
    });
  }, [lang]);

  // Faceta del caos: nombre, icono y wiki por idioma
  useEffect(() => {
    const normalized = (lang || 'en').toLowerCase();
    const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
    const nameByLang: Record<string, string> = {
      'es': 'Faceta del caos',
      'en': 'Facet of Chaos',
      'fr': 'Facette du chaos',
      'de': 'Aspekt des Chaos'
    };
    const wikiByLang: Record<string, string> = {
      'es': 'https://wiki.guildwars2.com/wiki/Facet_of_Chaos',
      'en': 'https://wiki.guildwars2.com/wiki/Facet_of_Chaos',
      'fr': 'https://wiki-fr.guildwars2.com/wiki/Facette_du_chaos',
      'de': 'https://wiki-de.guildwars2.com/wiki/Aspekt_des_Chaos'
    };
    
    setFacetaCaosData({
      name: nameByLang[langKey] || nameByLang['en'],
      icon: 'https://wiki.guildwars2.com/images/c/c7/Facet_of_Chaos.png',
      wikiUrl: wikiByLang[langKey] || wikiByLang['en']
    });
  }, [lang]);


  useEffect(() => {
    fetchItemData();
    fetchSkillData();
    fetchVitalityData();
    fetchFireData();
    fetchBaluarteData();
    fetchFuncionalData();
    fetchMedicoData();
    fetchFurtivoData();
    fetchVampirismoData();
    fetchTercerTomoData();
    fetchPrimerTomoData();
    fetchHabilidad1Data();
    fetchMantraData();
    fetchSelloData();
    fetchHabilidad2Data();
    fetchHabilidad3Data();
    fetchHabilidad4Data();
    fetchRuna24836Data();
    fetchFuerzaData();
    fetchPrecisionData();
    fetchRuna100148Data();
    fetchRunaVelocidadData();
    fetchSpiritShardsData();
    fetchBlackLionBoostData();
    fetchExperienceBoostData();
    fetchCommunalBonfireData();
    fetchZampacaramelosData();
    fetchItem20002Data();
    fetchCelebrationBoostData();
    fetchStrawberryGhostData();
    fetchChatoyantElixirData();
    fetchTrickOrTreatBagsData();
    fetchCandyCornData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <>
      <div 
        className="min-h-screen relative"
        style={{
          backgroundImage: 'url(/images/backgrounds/Halloween.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay oscuro para mejorar la legibilidad */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Contenido principal */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8">
            {/* Botón Volver */}
            <div className="flex justify-start mb-4">
              <a
                href="/festivals/halloween"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-orange-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <ArrowLeft className="w-4 h-4" />
            {t('halloween.labyrinth.backToHalloween')}
              </a>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <span className="text-3xl mr-3">🎃</span>
              {t('halloween.labyrinth.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              {t('halloween.labyrinth.subtitle')}
            </p>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto mt-6 leading-relaxed">
              {t('halloween.labyrinth.description')}
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => navigateToSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedSection === section.id
                    ? 'bg-orange-600/80 text-white border border-orange-400/50 shadow-lg'
                    : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800/90 border border-orange-500/20 hover:border-orange-500/40'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </motion.div>

          {/* Content Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Overview Section */}
            {selectedSection === 'overview' && (
              <div id="section-overview" className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <Info className="w-6 h-6 mr-3 text-orange-400" />
                    {t('halloween.labyrinth.overview.title')}
                  </h2>
                  
                  <div className="prose prose-invert max-w-none">
                     <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                     {t('halloween.labyrinth.overview.description')} <button 
                       onClick={() => navigateToSection('builds')}
                       className="text-orange-400 hover:text-orange-300 underline font-semibold transition-colors duration-200"
                     >
                       {t('halloween.labyrinth.overview.bestBuilds')}
                     </button>, {t('halloween.labyrinth.overview.prepareBenefit')}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3 flex items-center">
                          <Target className="w-5 h-5 mr-2 text-orange-400" />
                          {t('halloween.labyrinth.overview.whatIsLabyrinth')}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {t('halloween.labyrinth.overview.whatIsLabyrinthDescription')}
                        </p>
                      </div>
                      
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3 flex items-center">
                          <Coins className="w-5 h-5 mr-2 text-yellow-400" />
                          {t('halloween.labyrinth.overview.goldPerHour')}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {(() => {
                            const description = t('halloween.labyrinth.overview.goldPerHourDescription');
                            const spiritShardsText = t('currency.spiritShards');
                            const splitPattern = `30 ${spiritShardsText}`;
                            
                            return description.split(splitPattern).map((part, index) => (
                              <span key={index}>
                                {part}
                                {index === 0 && (
                                  <>
                                    <span className="inline-flex items-center gap-1">
                                      30 
                                      {spiritShardsData?.icon ? (
                                        <Image
                                          src={spiritShardsData.icon}
                                          alt={spiritShardsData.name}
                                          width={16}
                                          height={16}
                                          className="inline"
                                        />
                                      ) : (
                                        spiritShardsText
                                      )}
                                    </span>
                                  </>
                                )}
                              </span>
                            ));
                          })()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                      <h3 className="text-red-300 font-semibold mb-2 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        {t('halloween.labyrinth.overview.attention')}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {t('halloween.labyrinth.overview.attentionDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

             {/* Builds Section */}
             {selectedSection === 'builds' && (
               <div id="section-builds" className="space-y-8">
                 <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 shadow-2xl">
                   <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                     <Sword className="w-6 h-6 mr-3 text-orange-400" />
                    {t('halloween.labyrinth.builds.title')}
                   </h2>
                   
                   <div className="prose prose-invert max-w-none mb-8">
                     <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                    {t('halloween.labyrinth.content.intro')}
                     </p>
                   </div>

                   {/* Puntos comunes importantes */}
                   <div className="space-y-6 mb-8">
                     <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                       <h3 className="text-red-300 font-semibold mb-3 flex items-center">
                         <AlertTriangle className="w-5 h-5 mr-2" />
                         {t('halloween.labyrinth.builds.commonPoints')}
                       </h3>
                       
                      <div className="space-y-4">
                         <div className="bg-red-800/20 border border-red-400/30 rounded-lg p-3">
                           <h4 className="text-red-200 font-semibold mb-2 flex items-center">
                             <span className="text-lg mr-2">🚫</span>
                             {t('halloween.labyrinth.builds.noAccessories')}
                           </h4>
                           <p className="text-gray-300 text-sm">
                             {t('halloween.labyrinth.builds.noAccessoriesDescription')}
                           </p>
                         </div>

                         <div className="flex items-start gap-3">
                           <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                           <div>
                             <h4 className="text-white font-semibold">{t('halloween.labyrinth.builds.foodAndImprovements')}</h4>
                             <p className="text-gray-300 text-sm">
                               {t('halloween.labyrinth.builds.foodAndImprovementsDescription')}
                             </p>
                           </div>
                         </div>

                         <div className="flex items-start gap-3">
                           <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                           <div>
                             <h4 className="text-white font-semibold">{t('halloween.labyrinth.builds.alternativeStats')}</h4>
                             <p className="text-gray-300 text-sm">
                               {t('halloween.labyrinth.builds.alternativeStatsDescription')}
                             </p>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-6">
                     {/* Contenido */}
                     <div className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-4">
                       <h3 className="text-white font-semibold mb-4 flex items-center">
                         <List className="w-5 h-5 mr-2 text-orange-400" />
                         {t('halloween.labyrinth.builds.content')}
                       </h3>
                       <div className="space-y-3">
                         <button 
                           onClick={() => navigateToSection('builds', 'chatarrero-supervelocidad')}
                           className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-200 w-full text-left"
                         >
                           <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                           <span className="text-gray-200 font-medium">{t('halloween.labyrinth.builds.scrapper')}</span>
                         </button>
                         <button 
                           onClick={() => navigateToSection('builds', 'abrasador-justicia')}
                           className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-200 w-full text-left"
                         >
                           <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                           <span className="text-gray-200 font-medium">{t('halloween.labyrinth.builds.firebrand')}</span>
                         </button>
                         <button 
                           onClick={() => navigateToSection('builds', 'mirage-spammer')}
                           className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-200 w-full text-left"
                         >
                           <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                           <span className="text-gray-200 font-medium">{t('halloween.labyrinth.builds.mirage')}</span>
                         </button>
                         <button 
                           onClick={() => navigateToSection('builds', 'temerario-poder')}
                           className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-200 w-full text-left"
                         >
                           <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                           <span className="text-gray-200 font-medium">{t('halloween.labyrinth.builds.daredevilPower')}</span>
                         </button>
                         <button 
                           onClick={() => navigateToSection('builds', 'temerario-condicion')}
                           className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-200 w-full text-left"
                         >
                           <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                           <span className="text-gray-200 font-medium">{t('halloween.labyrinth.builds.daredevilCondi')}</span>
                         </button>
                       </div>
                     </div>

                     {/* Build detallada: Chatarrero Supervelocidad */}
                     <div id="chatarrero-supervelocidad" className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-6">
                       <h3 className="text-white font-semibold mb-4 flex items-center">
                         <Image
                           src="https://wiki-es.guildwars2.com/images/9/95/Chatarrero_icono_%28highres%29.png"
                           alt="Chatarrero"
                           width={64}
                           height={64}
                           className="mr-2 rounded"
                           onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                         />
                        {t('halloween.labyrinth.builds.scrapper')}
                       </h3>
                       
                       <div className="prose prose-invert max-w-none">
                         <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                            {t('halloween.labyrinth.builds.scrapper.description.part1')} {skillData ? (
                             <span className="inline-flex items-center gap-1">
                               <Image
                                 src={skillData.icon}
                                 alt={skillData.name}
                                 width={16}
                                 height={16}
                                 className="rounded align-middle"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{skillData.name}</span>
                             </span>
                           ) : (
                             <span className="text-orange-300 font-semibold">supervelocidad</span>
                           )} {t('halloween.labyrinth.builds.scrapper.description.part2')}
                         </p>
                         <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                        {t('halloween.labyrinth.builds.scrapper.description.part3')}
                         </p>
                         <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                           {t('halloween.labyrinth.builds.scrapper.equipment')} {itemData ? (
                             <a 
                               href={itemData.wikiUrl}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={itemData.icon}
                                 alt={itemData.name}
                                 width={18}
                                 height={18}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{itemData.name}</span>
                             </a>
                           ) : (
                             <a 
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Rune_of_the_Zephyrite' : `https://wiki-${lang}.guildwars2.com/wiki/Superior_Rune_of_the_Zephyrite`}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                             >
                               Superior Rune of the Zephyrite
                             </a>
                           )} {t('halloween.labyrinth.builds.scrapper.equipment.ifMore')} {skillData ? (
                             <span className="inline-flex items-center gap-1">
                               <Image
                                 src={skillData.icon}
                                 alt={skillData.name}
                                 width={18}
                                 height={18}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{skillData.name}</span>
                             </span>
                           ) : (
                             <span className="text-orange-300 font-semibold">supervelocidad</span>
                          )} {t('common.and')} {relicSpeedData ? (
                            <a
                              href={relicSpeedData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {relicSpeedData.icon && (
                                <Image
                                  src={relicSpeedData.icon}
                                  alt={relicSpeedData.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{relicSpeedData.name}</span>
                            </a>
                          ) : (
                            <span className="text-orange-300 font-semibold">Relic of Speed</span>
                          )} {t('halloween.labyrinth.builds.scrapper.equipment.ifMoreSurvival')}. {t('halloween.labyrinth.builds.scrapper.weapons')} {vitalityData ? (
                             <a 
                               href={vitalityData.wikiUrl}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={vitalityData.icon}
                                 alt={vitalityData.name}
                                 width={16}
                                 height={16}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{vitalityData.name}</span>
                             </a>
                           ) : (
                             <a 
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina' : 
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Cachet_d%27endurance_sup%C3%A9rieur' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_der_Ausdauer' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina'}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                             >
                               vitalidad
                             </a>
                           )} {t('common.and')} {fireData ? (
                             <a 
                               href={fireData.wikiUrl}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={fireData.icon}
                                 alt={fireData.name}
                                 width={16}
                                 height={16}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{fireData.name}</span>
                             </a>
                           ) : (
                             <a 
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire' : 
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Cachet_de_feu_sup%C3%A9rieur' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_des_Feuers' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire'}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                             >
                               fuego
                             </a>
                           )}.
                         </p>
                         <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                           {t('halloween.labyrinth.builds.scrapper.abilities')} {skillData ? (
                             <span className="inline-flex items-center gap-1">
                               <Image
                                 src={skillData.icon}
                                 alt={skillData.name}
                                 width={18}
                                 height={18}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{skillData.name}</span>
                             </span>
                           ) : (
                             <span className="text-orange-300 font-semibold">supervelocidad</span>
                           )} {t('halloween.labyrinth.builds.scrapper.abilities.and')} {skillData ? (
                             <span className="inline-flex items-center gap-1">
                               <Image
                                 src={skillData.icon}
                                 alt={skillData.name}
                                 width={18}
                                 height={18}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{skillData.name}</span>
                             </span>
                           ) : (
                             <span className="text-orange-300 font-semibold">supervelocidad</span>
                           )}. {t('halloween.labyrinth.builds.scrapper.abilities.other')}
                         </p>
                       </div>
                       
                       {/* Código de traits */}
                       <div className="mt-6">
                         <div className="flex items-center justify-between mb-2">
                           <h4 className="text-white font-semibold flex items-center">
                             <span className="text-lg mr-2">⚙️</span>
                             {t('halloween.labyrinth.builds.traitsCode')}
                           </h4>
                           <button
                             onClick={() => {
                               navigator.clipboard.writeText('[&DQMmLx0+Ky3ZEgAADhMAAJMBAACNAQAAgxIAAAAAAAAAAAAAAAAAAAAAAAA=]');
                               setShowCopyModal(true);
                               // Auto-cerrar el modal después de 2 segundos
                               setTimeout(() => setShowCopyModal(false), 2000);
                             }}
                             className="flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors duration-200"
                           >
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                             </svg>
                             {t('halloween.labyrinth.builds.copyCode')}
                           </button>
                         </div>
                         <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-3">
                           <code className="text-orange-300 text-sm font-mono break-all">
                             [&DQMmLx0+Ky3ZEgAADhMAAJMBAACNAQAAgxIAAAAAAAAAAAAAAAAAAAAAAAA=]
                           </code>
                         </div>
                       </div>

                       {/* Imagen de skills y traits */}
                       <div className="mt-6">
                         <Image
                           src="/thumbnails/skills-y-traits-chat-1024x576.webp"
                           alt="Skills y Traits - Chatarrero Supervelocidad"
                           width={1024}
                           height={576}
                           className="w-full h-auto rounded-lg border border-orange-500/30 shadow-lg"
                           onError={(e) => { 
                             console.error('Error loading image:', e);
                             (e.currentTarget as HTMLImageElement).style.display = 'none'; 
                           }}
                         />
                         
                         {/* Instrucciones de uso */}
                         <div className="mt-4 space-y-3">
                          <p className="text-gray-200 text-sm leading-relaxed">
                            {t('halloween.labyrinth.scrapper.usage.part1')}{' '}
                            {skillData ? (
                               <span className="inline-flex items-center gap-1">
                                 <Image
                                   src={skillData.icon}
                                   alt={skillData.name}
                                   width={20}
                                   height={20}
                                   className="rounded"
                                   onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                 />
                                 <span className="text-orange-300 font-semibold">{skillData.name}</span>
                               </span>
                             ) : (
                              <span className="text-orange-300 font-semibold">{t('halloween.labyrinth.scrapper.usage.superspeedFallback')}</span>
                            )}{' '}
                            {t('halloween.labyrinth.scrapper.usage.part2')}
                           </p>
                          <p className="text-gray-200 text-sm leading-relaxed">
                            {t('halloween.labyrinth.scrapper.usage.priority')}{' '}
                            {baluarteData ? (
                               <span className="inline-flex items-center gap-1">
                                 <Image
                                   src={baluarteData.icon}
                                   alt={baluarteData.name}
                                   width={20}
                                   height={20}
                                   className="rounded"
                                   onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                 />
                                 <span className="text-orange-300 font-semibold">{baluarteData.name}</span>
                               </span>
                             ) : (
                              <span className="text-orange-300 font-semibold">{'(sin datos)'}</span>
                             )}, {funcionalData ? (
                               <span className="inline-flex items-center gap-1">
                                 <Image
                                   src={funcionalData.icon}
                                   alt={funcionalData.name}
                                   width={20}
                                   height={20}
                                   className="rounded"
                                   onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                 />
                                 <span className="text-orange-300 font-semibold">{funcionalData.name}</span>
                               </span>
                             ) : (
                              <span className="text-orange-300 font-semibold">{'(sin datos)'}</span>
                             )}, {medicoData ? (
                               <span className="inline-flex items-center gap-1">
                                 <Image
                                   src={medicoData.icon}
                                   alt={medicoData.name}
                                   width={20}
                                   height={20}
                                   className="rounded"
                                   onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                 />
                                 <span className="text-orange-300 font-semibold">{medicoData.name}</span>
                               </span>
                             ) : (
                              <span className="text-orange-300 font-semibold">{'(sin datos)'}</span>
                             )} {t('common.and')} {furtivoData ? (
                               <span className="inline-flex items-center gap-1">
                                 <Image
                                   src={furtivoData.icon}
                                   alt={furtivoData.name}
                                   width={20}
                                   height={20}
                                   className="rounded"
                                   onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                 />
                                 <span className="text-orange-300 font-semibold">{furtivoData.name}</span>
                               </span>
                             ) : (
                              <span className="text-orange-300 font-semibold">{'(sin datos)'}</span>
                             )}.
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Build detallada: Abrasador Justicia */}
                     <div id="abrasador-justicia" className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-6">                    
                         <h3 className="text-white font-semibold mb-4 flex items-center">
                           <Image
                             src="https://wiki.guildwars2.com/images/0/0b/Firebrand_icon_%28highres%29.png"
                             alt="Firebrand"
                             width={64}
                             height={64}
                             className="mr-2 rounded"
                             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                           />
                          {t('halloween.labyrinth.builds.firebrand')}
                         </h3>
                       
                       <div className="prose prose-invert max-w-none">
                         <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                        {t('halloween.labyrinth.builds.firebrand.description')}
                         </p>
                        <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                          {t('halloween.labyrinth.firebrand.equipmentIntro')} {vampirismoData ? (
                             <a 
                               href={vampirismoData.wikiUrl}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={vampirismoData.icon}
                                 alt={vampirismoData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{vampirismoData.name}</span>
                             </a>
                           ) : (
                             <a 
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Rune_of_Vampirism' : 
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Rune_sup%C3%A9rieure_de_vampirisme' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegene_Rune_des_Vampirismus' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Rune_of_Vampirism'}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                             >
                               Runa de Vampirismo
                             </a>
                           )} {t('common.and')} {runa100148Data ? (
                             <a 
                               href={runa100148Data.wikiUrl}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={runa100148Data.icon}
                                 alt={runa100148Data.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{runa100148Data.name}</span>
                             </a>
                           ) : (
                              <span className="text-orange-300 font-semibold">Runa 100148</span>
                           )}. {t('halloween.labyrinth.firebrand.weaponsIntro')} {vitalityData && vitalityData.icon ? (
                             <a
                               href={vitalityData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={vitalityData.icon}
                                 alt={vitalityData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{vitalityData.name}</span>
                             </a>
                           ) : (
                             <a
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina' :
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Cachet_d%27endurance_sup%C3%A9rieur' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_der_Ausdauer' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                             >
                               Vitalidad
                             </a>
                           )} {t('common.and')} {fireData && fireData.icon ? (
                             <a
                               href={fireData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={fireData.icon}
                                 alt={fireData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{fireData.name}</span>
                             </a>
                           ) : (
                             <a
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire' :
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Cachet_de_feu_sup%C3%A9rieur' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_des_Feuers' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                             >
                               Fuego
                             </a>
                           )}.
                         </p>
                        <p className="text-gray-200 mb-4 text-sm leading-relaxed">{t('halloween.labyrinth.firebrand.skillsSummary')}</p>
                         <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                          {t('halloween.labyrinth.firebrand.tomesIntro')}{tercerTomoData && tercerTomoData.icon ? (
                            <a
                              href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Tome_of_Courage' :
                                     lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Grimoire_du_courage' :
                                     lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/Foliant_der_Tapferkeit' :
                                                     'https://wiki.guildwars2.com/wiki/Tome_of_Courage'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src={tercerTomoData.icon}
                                alt={tercerTomoData.name}
                                width={20}
                                height={20}
                                className="rounded"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                              <span className="text-orange-300 font-semibold">
                                {lang === 'es' ? 'Tomo de valor' : lang === 'fr' ? 'Grimoire du courage' : lang === 'de' ? 'Foliant der Tapferkeit' : 'Tome of Courage'}
                              </span>
                            </a>
                          ) : (
                            <a
                              href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Tome_of_Courage' :
                                     lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Grimoire_du_courage' :
                                     lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/Foliant_der_Tapferkeit' :
                                                     'https://wiki.guildwars2.com/wiki/Tome_of_Courage'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-300 font-semibold hover:opacity-80 transition-opacity"
                            >
                              {lang === 'es' ? 'Tomo de valor' : lang === 'fr' ? 'Grimoire du courage' : lang === 'de' ? 'Foliant der Tapferkeit' : 'Tome of Courage'}
                            </a>
                          )}.
                         </p>
                         
                         {/* Código de traits */}
                         <div className="mt-6">
                           <div className="flex items-center justify-between mb-2">
                             <h4 className="text-white font-semibold flex items-center">
                               <span className="text-lg mr-2">⚙️</span>
                                {t('halloween.labyrinth.builds.traitsCode')}  
                             </h4>
                             <button
                               onClick={() => {
                                 navigator.clipboard.writeText('[&DQEQGS4XPitLFwAALQEAAEcBAABMAQAAiRIAAAAAAAAAAAAAAAAAAAAAAAA=]');
                                 setShowCopyModal(true);
                                 // Auto-cerrar el modal después de 2 segundos
                                 setTimeout(() => setShowCopyModal(false), 2000);
                               }}
                               className="flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors duration-200"
                             >
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                               </svg>
                               {t('halloween.labyrinth.builds.copyCode')}
                             </button>
                           </div>
                           <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-3">
                             <code className="text-orange-300 text-sm font-mono break-all">
                               [&DQEQGS4XPitLFwAALQEAAEcBAABMAQAAiRIAAAAAAAAAAAAAAAAAAAAAAAA=]
                             </code>
                           </div>
                         </div>
                         
                         {/* Imagen de skills y traits */}
                         <div className="mt-6">
                           <Image
                             src="/thumbnails/skills-y-traits-fb-1024x576.webp"
                             alt="Skills y Traits del Abrasador Justicia"
                             width={1024}
                             height={576}
                             className="w-full h-auto rounded-lg border border-orange-500/30"
                             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                           />
                         </div>
                         
                         {/* Instrucciones de uso detalladas */}
                         <div className="mt-6">
                           <div className="space-y-4">
                              <p className="text-gray-200 text-sm leading-relaxed">
                              {t('halloween.labyrinth.builds.firebrand.trait')} {primerTomoData && primerTomoData.icon ? (
                                  <a 
                                    href={primerTomoData.wikiUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                  >
                                    <Image
                                      src={primerTomoData.icon}
                                      alt={primerTomoData.name}
                                      width={20}
                                      height={20}
                                      className="rounded"
                                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span className="text-orange-300 font-semibold">{primerTomoData.name}</span>
                                  </a>
                                 ) : (
                                   <span className="text-orange-300 font-semibold">primer tomo</span>
                                )} {t('halloween.labyrinth.builds.firebrand.trait.description')}
                               </p>
                              <p className="text-gray-200 text-sm leading-relaxed">
                                {t('halloween.labyrinth.firebrand.usageIntro')} {primerTomoData && primerTomoData.icon ? (
                                  <a 
                                    href={primerTomoData.wikiUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                  >
                                    <Image
                                      src={primerTomoData.icon}
                                      alt={primerTomoData.name}
                                      width={20}
                                      height={20}
                                      className="rounded"
                                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span className="text-orange-300 font-semibold">{primerTomoData.name}</span>
                                  </a>
                                 ) : (
                                   <span className="text-orange-300 font-semibold">primer tomo</span>
                                )}, {t('common.use')} <a
                                  href={buildSigilWikiUrl('epilogo-cenizas')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                >
                                  <Image
                                    src="https://wiki-es.guildwars2.com/images/d/d3/Ep%C3%ADlogo-_Las_cenizas_de_los_justos.png"
                                    alt={t('halloween.labyrinth.firebrand.epilogueAshes')}
                                    width={20}
                                    height={20}
                                    className="rounded"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                  />
                                  <span className="text-orange-300 font-semibold">{t('halloween.labyrinth.firebrand.epilogueAshes')}</span>
                                </a> {t('common.whenAvailable')}, <span className="inline-flex items-center gap-1">
                                   <Image
                                     src="https://wiki-es.guildwars2.com/images/e/e7/Cap%C3%ADtulo_2-_Estallido_calcinante.png"
                                    alt={t('halloween.labyrinth.firebrand.chapter2')}
                                     width={20}
                                     height={20}
                                     className="rounded"
                                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                   />
                                  <a
                                    href={lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Chapitre_2_:_Explosion_ardente' : lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/Kapitel_2:_Entz%C3%BCndende_Welle' : 'https://wiki.guildwars2.com/wiki/Chapter_2:_Igniting_Burst'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-300 font-semibold hover:opacity-80 transition-opacity"
                                  >
                                    {t('halloween.labyrinth.firebrand.chapter2')}
                                  </a>
                                </span> {t('common.andThen')} {t('common.use')} <span className="inline-flex items-center gap-1">
                                   <Image
                                     src="https://wiki-es.guildwars2.com/images/d/dc/Cap%C3%ADtulo_1-_Hechizo_abrasador.png"
                                    alt={t('halloween.labyrinth.firebrand.chapter1')}
                                     width={20}
                                     height={20}
                                     className="rounded"
                                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                   />
                                  <a
                                    href={lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Chapitre_1_:_Sort_br%C3%BBlant' : lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/Kapitel_1:_Sengender_Zauber' : 'https://wiki.guildwars2.com/wiki/Chapter_1:_Searing_Spell'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-300 font-semibold hover:opacity-80 transition-opacity"
                                  >
                                    {t('halloween.labyrinth.firebrand.chapter1')}
                                  </a>
                                </span> {t('halloween.labyrinth.firebrand.untilEnds')} {t('halloween.labyrinth.firebrand.ifDoorUse')} <span className="inline-flex items-center gap-1">
                                   <Image
                                     src="https://wiki-es.guildwars2.com/images/e/ee/Cap%C3%ADtulo_4-_Tierra_quemada.png"
                                    alt={t('halloween.labyrinth.firebrand.chapter4')}
                                     width={20}
                                     height={20}
                                     className="rounded"
                                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                   />
                                  <a
                                    href={lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Chapitre_4_:_Cons%C3%A9quences_br%C3%BBlantes' : lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/Kapitel_4:_Die_versengten_Folgen' : 'https://wiki.guildwars2.com/wiki/Chapter_4:_Scorched_Aftermath'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-300 font-semibold hover:opacity-80 transition-opacity"
                                  >
                                    {t('halloween.labyrinth.firebrand.chapter4')}
                                  </a>
                                </span> {t('halloween.labyrinth.firebrand.rightSideSkills')}
                               </p>
                           </div>
                         </div>
                       </div>
                     </div>

                     <div id="mirage-spammer" className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-6">
                       <h3 className="text-white font-semibold mb-4 flex items-center">
                         <Image
                           src="https://wiki-es.guildwars2.com/images/9/92/Quim%C3%A9rico_icono_%28highres%29.png"
                           alt="Quimérico"
                           width={64}
                           height={64}
                           className="mr-2 rounded"
                           onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                         />
                        {t('halloween.labyrinth.builds.mirage')}
                       </h3>
                       
                       <div className="space-y-4">
                         <p className="text-gray-200 text-sm leading-relaxed">
                        {t('halloween.labyrinth.builds.mirage.description')}
                         </p>
                         
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {t('halloween.labyrinth.mirage.equipmentIntro')} {runa100148Data && runa100148Data.icon ? (
                             <a
                               href={runa100148Data.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={runa100148Data.icon}
                                 alt={runa100148Data.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{runa100148Data.name}</span>
                             </a>
                           ) : (
                             <a
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Rune_of_Speed' :
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Rune_sup%C3%A9rieure_de_vitesse' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegene_Rune_der_Geschwindigkeit' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Rune_of_Speed'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                            >
                              {t('halloween.labyrinth.mirage.rune100148Fallback')}
                             </a>
                          )} {t('common.and')} {vampirismoData && vampirismoData.icon ? (
                             <a
                               href={vampirismoData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={vampirismoData.icon}
                                 alt={vampirismoData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{vampirismoData.name}</span>
                             </a>
                           ) : (
                             <a
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Rune_of_Vampirism' :
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Rune_sup%C3%A9rieure_de_vampirisme' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegene_Rune_des_Vampirismus' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Rune_of_Vampirism'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                            >
                              {t('halloween.labyrinth.mirage.vampirismFallback')}
                             </a>
                          )} {t('halloween.labyrinth.mirage.survivalNote')} {t('halloween.labyrinth.mirage.weaponsIntro')} {vitalityData && vitalityData.icon ? (
                             <a
                               href={vitalityData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={vitalityData.icon}
                                 alt={vitalityData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{vitalityData.name}</span>
                             </a>
                           ) : (
                             <a
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina' :
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Cachet_d%27endurance_sup%C3%A9rieur' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_der_Ausdauer' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                            >
                              {t('halloween.labyrinth.mirage.vitalityFallback')}
                             </a>
                          )} {t('common.and')} {fireData && fireData.icon ? (
                             <a
                               href={fireData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={fireData.icon}
                                 alt={fireData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{fireData.name}</span>
                             </a>
                           ) : (
                             <a
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire' :
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Cachet_de_feu_sup%C3%A9rieur' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_des_Feuers' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                            >
                              {t('halloween.labyrinth.mirage.fireFallback')}
                             </a>
                          )}. {t('halloween.labyrinth.mirage.vitalSigilImportant.prefix')} {vitalityData && vitalityData.icon ? (
                             <a
                               href={vitalityData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={vitalityData.icon}
                                 alt={vitalityData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{vitalityData.name}</span>
                             </a>
                           ) : (
                             <a
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina' :
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Cachet_d%27endurance_sup%C3%A9rieur' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_der_Ausdauer' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                            >
                              {t('halloween.labyrinth.mirage.vitalityFallback')}
                             </a>
                          )} {t('halloween.labyrinth.mirage.vitalSigilImportant.suffix')}
                         </p>
                         
                        <p className="text-gray-200 text-sm leading-relaxed">{t('halloween.labyrinth.mirage.abilitiesSummary')}</p>
                         
                         <div className="space-y-4">
                           <div>
                             <div className="flex items-center justify-between mb-2">
                               <h4 className="text-white font-semibold flex items-center">
                                 <span className="text-lg mr-2">⚙️</span>
                                 {t('halloween.labyrinth.builds.traitsCode')}
                               </h4>
                               <button
                                 onClick={() => {
                                   navigator.clipboard.writeText('[&DQcBOgoZOxnuFSMPaQEHFmUBgQGAAYMBRhe8AQAAAAAAAAAAAAAAAAAAAAA=]');
                                   setShowCopyModal(true);
                                   // Auto-cerrar el modal después de 2 segundos
                                   setTimeout(() => setShowCopyModal(false), 2000);
                                 }}
                                 className="flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors duration-200"
                               >
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                 </svg>
                                 {t('halloween.labyrinth.builds.copyCode')}
                               </button>
                             </div>
                             <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-3">
                               <code className="text-orange-300 text-sm font-mono break-all">
                                 [&DQcBOgoZOxnuFSMPaQEHFmUBgQGAAYMBRhe8AQAAAAAAAAAAAAAAAAAAAAA=]
                               </code>
                             </div>
                           </div>
                           
                           <div>
                            <Image
                               src="/thumbnails/skills-y-traits-mirage-1-1024x576.webp"
                              alt={t('halloween.labyrinth.mirage.imageAlt')}
                               width={1024}
                               height={576}
                               className="w-full h-auto rounded-lg border border-orange-500/30"
                               onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                             />
                             <p className="text-gray-200 text-sm leading-relaxed mt-4">
                              {t('halloween.labyrinth.mirage.traitsSummary')}
                             </p>
                            <p className="text-gray-200 text-sm leading-relaxed">
                              {t('halloween.labyrinth.mirage.method.introPrefix')} {habilidad1Data && habilidad1Data.icon ? (
                                 <a href={habilidad1Data.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline">
                                   <Image
                                     src={habilidad1Data.icon}
                                     alt={habilidad1Data.name}
                                     width={20}
                                     height={20}
                                     className="rounded"
                                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                   />
                                   <span className="text-orange-300 font-semibold">{habilidad1Data.name}</span>
                                 </a>
                               ) : (
                                 <span className="text-orange-300 font-semibold">1</span>
                              )} {t('halloween.labyrinth.mirage.method.andRepeat')} {t('halloween.labyrinth.mirage.method.the')} {mantraData && mantraData.icon ? (
                                 <a href={mantraData.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline">
                                   <Image
                                     src={mantraData.icon}
                                     alt={mantraData.name}
                                     width={20}
                                     height={20}
                                     className="rounded"
                                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                   />
                                   <span className="text-orange-300 font-semibold">{mantraData.name}</span>
                                 </a>
                               ) : (
                                 <span className="text-orange-300 font-semibold">mantra</span>
                              )} {t('halloween.labyrinth.mirage.method.throwMantraSuffix')} {selloData && selloData.icon ? (
                                 <a href={selloData.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline">
                                   <Image
                                     src={selloData.icon}
                                     alt={selloData.name}
                                     width={20}
                                     height={20}
                                     className="rounded"
                                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                   />
                                   <span className="text-orange-300 font-semibold">{selloData.name}</span>
                                 </a>
                               ) : (
                                 <span className="text-orange-300 font-semibold">sello</span>
                              )} {t('halloween.labyrinth.mirage.method.endPrefix')} {habilidad2Data && habilidad2Data.icon ? (
                                 <a href={habilidad2Data.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline">
                                   <Image
                                     src={habilidad2Data.icon}
                                     alt={habilidad2Data.name}
                                     width={20}
                                     height={20}
                                     className="rounded"
                                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                   />
                                   <span className="text-orange-300 font-semibold">{habilidad2Data.name}</span>
                                 </a>
                               ) : (
                                 <span className="text-orange-300 font-semibold">el 2</span>
                              )} {t('common.and')} {habilidad3Data && habilidad3Data.icon ? (
                                 <a href={habilidad3Data.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline">
                                   <Image
                                     src={habilidad3Data.icon}
                                     alt={habilidad3Data.name}
                                     width={20}
                                     height={20}
                                     className="rounded"
                                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                   />
                                   <span className="text-orange-300 font-semibold">{habilidad3Data.name}</span>
                                 </a>
                               ) : (
                                 <span className="text-orange-300 font-semibold">el 3</span>
                             )}, {t('halloween.labyrinth.mirage.method.forBossesUse')} {habilidad4Data && habilidad4Data.icon ? (
                                 <a href={habilidad4Data.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline">
                                   <Image
                                     src={habilidad4Data.icon}
                                     alt={habilidad4Data.name}
                                     width={20}
                                     height={20}
                                     className="rounded"
                                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                   />
                                   <span className="text-orange-300 font-semibold">{habilidad4Data.name}</span>
                                 </a>
                               ) : (
                                 <span className="text-orange-300 font-semibold">el 4</span>
                              )} {t('halloween.labyrinth.mirage.method.also')}
                             </p>
                            <p className="text-gray-200 text-sm leading-relaxed">{t('halloween.labyrinth.mirage.shattersUsage')}</p>
                           </div>
                         </div>
                         
                       </div>
                     </div>

                     <div id="temerario-poder" className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-6">
                       <h3 className="text-white font-semibold mb-4 flex items-center">
                         <Image
                           src="https://wiki-es.guildwars2.com/images/e/e6/Temerario_icono_%28highres%29.png"
                           alt="Temerario"
                           width={64}
                           height={64}
                           className="mr-2 rounded"
                           onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                         />
                        {t('halloween.labyrinth.builds.daredevilPower')}
                       </h3>
                       
                       <div className="space-y-4">
                         <p className="text-gray-200 text-sm leading-relaxed">
                        {t('halloween.labyrinth.builds.daredevilPower.description')}
                         </p>
                         
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {t('halloween.labyrinth.builds.daredevilPower.equipment')} {runa24836Data && runa24836Data.icon ? (
                             <a
                               href={runa24836Data.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={runa24836Data.icon}
                                 alt={runa24836Data.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{runa24836Data.name}</span>
                             </a>
                           ) : (
                             <span className="text-orange-300 font-semibold">Runa 24836</span>
                          )} {t('common.and')} {relicVampirismData ? (
                            <a
                              href={relicVampirismData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {relicVampirismData.icon && (
                                <Image
                                  src={relicVampirismData.icon}
                                  alt={relicVampirismData.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{relicVampirismData.name}</span>
                            </a>
                          ) : (
                            <a
                              href={buildSigilWikiUrl('velocidad')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                            >
                              Relic of Vampirism
                            </a>
                          )}. {t('halloween.labyrinth.builds.daredevilPower.weapons')} {vitalityData && vitalityData.icon ? (
                             <a
                               href={vitalityData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={vitalityData.icon}
                                 alt={vitalityData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{vitalityData.name}</span>
                             </a>
                           ) : (
                             <a
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina' :
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Cachet_d%27endurance_sup%C3%A9rieur' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_der_Ausdauer' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Stamina'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                             >
                               Vitalidad
                             </a>
                           )} {t('common.and')} {fireData && fireData.icon ? (
                             <a
                               href={fireData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={fireData.icon}
                                 alt={fireData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{fireData.name}</span>
                             </a>
                           ) : (
                             <a
                               href={lang === 'es' ? 'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire' :
                                   lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Cachet_de_feu_sup%C3%A9rieur' :
                                   lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/%C3%9Cberlegenes_Sigill_des_Feuers' :
                                   'https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Fire'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-orange-300 font-semibold hover:text-orange-200 transition-colors underline"
                             >
                               Fuego
                             </a>
                          )} {t('halloween.labyrinth.builds.daredevilPower.weapons.secondSet')} {fuerzaData && fuerzaData.icon ? (
                             <a
                               href={fuerzaData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={fuerzaData.icon}
                                 alt={fuerzaData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{fuerzaData.name}</span>
                             </a>
                           ) : (
                             <span className="text-orange-300 font-semibold">fuerza</span>
                           )} {t('common.and')} {precisionData && precisionData.icon ? (
                             <a
                               href={precisionData.wikiUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                             >
                               <Image
                                 src={precisionData.icon}
                                 alt={precisionData.name}
                                 width={20}
                                 height={20}
                                 className="rounded"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-orange-300 font-semibold">{precisionData.name}</span>
                             </a>
                           ) : (
                             <span className="text-orange-300 font-semibold">precisión</span>
                           )}{t('halloween.labyrinth.builds.daredevilPower.weapons.bossesNote')}
                         </p>
                         
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {t('halloween.labyrinth.builds.daredevilPower.usageIntroPrefix')} {trait1833Data ? (
                            <a
                              href={trait1833Data.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {trait1833Data.icon && (
                                <Image
                                  src={trait1833Data.icon}
                                  alt={trait1833Data.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{trait1833Data.name || trait1833Name}</span>
                            </a>
                          ) : (
                            <span className="text-orange-300 font-semibold">{trait1833Name}</span>
                          )}{t('halloween.labyrinth.builds.daredevilPower.autoAttackBow')}{t('halloween.labyrinth.builds.daredevilPower.maxEndurance')} <br/>{t('halloween.labyrinth.builds.daredevilPower.sourcesIntro')}<br/>
                          {vitalityData && vitalityData.icon ? (
                            <a
                              href={vitalityData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src={vitalityData.icon}
                                alt={vitalityData.name}
                                width={20}
                                height={20}
                                className="rounded"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                              <span className="text-orange-300 font-semibold">{vitalityData.name}</span>
                            </a>
                          ) : (
                            <a
                              href={buildSigilWikiUrl('vitality')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              <span className="text-orange-300 font-semibold">Sello superior de Stamina</span>
                            </a>
                          )}<br />
                          {channeledVigorData ? (
                            <a
                              href={channeledVigorData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {channeledVigorData.icon && (
                                <Image
                                  src={channeledVigorData.icon}
                                  alt={channeledVigorData.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{channeledVigorData.name}</span>
                            </a>
                          ) : (
                            <span className="text-orange-300 font-semibold">Vigor canalizado</span>
                          )} {t('common.and')} <a
                            href={brawlersTenacityData?.wikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                          >
                            {brawlersTenacityData?.icon && (
                              <Image
                                src={brawlersTenacityData.icon}
                                alt={brawlersTenacityData.name}
                                width={20}
                                height={20}
                                className="rounded"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                            )}
                            <span className="text-orange-300 font-semibold">{brawlersTenacityData?.name || 'La tenacidad del luchador'}</span>
                          </a><br />
                          {signetAgilityData ? (
                            <a
                              href={signetAgilityData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {signetAgilityData.icon && (
                                <Image
                                  src={signetAgilityData.icon}
                                  alt={signetAgilityData.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{signetAgilityData.name}</span>
                            </a>
                          ) : (
                            <span className="text-orange-300 font-semibold">Sello de agilidad</span>
                          )}<br />
                          {stealData ? (
                            <a
                              href={stealData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {stealData.icon && (
                                <Image
                                  src={stealData.icon}
                                  alt={stealData.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{stealData.name}</span>
                            </a>
                          ) : (
                            <span className="text-orange-300 font-semibold">Robar</span>
                          )} {t('common.dueTo')} {enduranceThiefData ? (
                            <a
                              href={enduranceThiefData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {enduranceThiefData.icon && (
                                <Image
                                  src={enduranceThiefData.icon}
                                  alt={enduranceThiefData.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{enduranceThiefData.name}</span>
                            </a>
                          ) : (
                            <span className="text-orange-300 font-semibold">Ladrón de resistencia</span>
                          )} <br />
                          {shadowstepData ? (
                            <a
                              href={shadowstepData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {shadowstepData.icon && (
                                <Image
                                  src={shadowstepData.icon}
                                  alt={shadowstepData.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{shadowstepData.name}</span>
                            </a>
                          ) : (
                            <span className="text-orange-300 font-semibold">Paso de sombra</span>
                          )}, {infiltratorsArrowData ? (
                            <a
                              href={infiltratorsArrowData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {infiltratorsArrowData.icon && (
                                <Image
                                  src={infiltratorsArrowData.icon}
                                  alt={infiltratorsArrowData.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{infiltratorsArrowData.name}</span>
                            </a>
                          ) : (
                            <span className="text-orange-300 font-semibold">Flecha del infiltrado</span>
                          )} {t('common.and')} {stealData ? (
                            <a
                              href={stealData.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {stealData.icon && (
                                <Image
                                  src={stealData.icon}
                                  alt={stealData.name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-orange-300 font-semibold">{stealData.name}</span>
                            </a>
                          ) : (
                            <span className="text-orange-300 font-semibold">Robar</span>
                          )} {t('halloween.labyrinth.builds.daredevilPower.keepAheadZerg')}.
                        </p>
                         
                         <p className="text-gray-200 text-sm leading-relaxed">
                           {t('halloween.labyrinth.builds.daredevilPower.bowExceptional')} {t('halloween.labyrinth.builds.daredevilPower.useFourAoEDoors')}
                         </p>
                         
                         <div className="space-y-4">
                           <div>
                             <div className="flex items-center justify-between mb-2">
                               <h4 className="text-white font-semibold flex items-center">
                                 <span className="text-lg mr-2">⚙️</span>
                                 {t('halloween.labyrinth.builds.traitsCode')}
                               </h4>
                               <button
                                 onClick={() => {
                                   navigator.clipboard.writeText('[&DQUcPSwWBxuUEgAAWAAAAFcBAABbAQAADgEAAAAAAAAAAAAAAAAAAAAAAAA=]');
                                   setShowCopyModal(true);
                                   // Auto-cerrar el modal después de 2 segundos
                                   setTimeout(() => setShowCopyModal(false), 2000);
                                 }}
                                 className="flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors duration-200"
                               >
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                 </svg>
                                 {t('halloween.labyrinth.builds.copyCode')}
                               </button>
                             </div>
                             <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-3">
                               <code className="text-orange-300 text-sm font-mono break-all">
                                 [&DQUcPSwWBxuUEgAAWAAAAFcBAABbAQAADgEAAAAAAAAAAAAAAAAAAAAAAAA=]
                               </code>
                             </div>
                           </div>
                           
                           <div>
                             <Image
                               src="/thumbnails/skills-y-traits-ladron-p-2-1024x576.webp"
                               alt="Skills y Traits - Temerario Poder"
                               width={1024}
                               height={576}
                               className="w-full h-auto rounded-lg border border-orange-500/30"
                               onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                             />
                            <p className="text-gray-200 text-sm leading-relaxed mt-4">
                              {t('halloween.labyrinth.builds.daredevilPower.traits')}
                            </p>
                            <p className="text-gray-200 text-sm leading-relaxed">
                              {t('halloween.labyrinth.builds.daredevilPower.usageSummary')}
                            </p>
                            <p className="text-gray-200 text-sm leading-relaxed">
                              {t('halloween.labyrinth.builds.daredevilPower.recoverDodges')}
                            </p>
                            <p className="text-gray-200 text-sm leading-relaxed">
                              {t('halloween.labyrinth.builds.daredevilPower.bossesUsage')}
                            </p>
                           </div>
                         </div>
                       </div>
                     </div>

                     <div id="temerario-condicion" className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-6">
                       <h3 className="text-white font-semibold mb-4 flex items-center">
                         <Image
                           src="https://wiki-es.guildwars2.com/images/b/b1/Heraldo_icono_%28highres%29.png"
                           alt="Temerario"
                           width={64}
                           height={64}
                           className="mr-2 rounded"
                           onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                         />
                          {t('halloween.labyrinth.builds.daredevilCondi')}
                       </h3>
                       
                       <div className="space-y-2">
                        <p className="text-gray-200 text-sm leading-relaxed">{t('halloween.labyrinth.herald.p1')}</p>
                        <p className="text-gray-200 text-sm leading-relaxed">{t('halloween.labyrinth.herald.p2')}</p>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {(() => {
                            const text = t('halloween.labyrinth.herald.p3');
                            const normalized = (lang || 'en').toLowerCase();
                            const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
                            
                            // Textos a buscar en cada idioma para ambos sellos
                            const energyTerms: Record<string, string> = {
                              'es': 'sellos de energía',
                              'en': 'Energy',
                              'fr': 'd\'énergie',
                              'de': 'Energiesiegel'
                            };
                            
                            const cleansingTerms: Record<string, string> = {
                              'es': 'purificación',
                              'en': 'Cleansing',
                              'fr': 'purification',
                              'de': 'Reinigungssiegel'
                            };
                            
                            const energyTerm = energyTerms[langKey] || energyTerms['en'];
                            const cleansingTerm = cleansingTerms[langKey] || cleansingTerms['en'];
                            
                            // Crear un patrón que incluya ambos términos
                            const combinedPattern = new RegExp(`(${energyTerm}|${cleansingTerm})`, 'g');
                            const parts = text.split(combinedPattern);
                            
                            return parts.map((part, index) => {
                              if (part === energyTerm) {
                                return sellosEnergiaData ? (
                                  <a 
                                    key={`energy-${index}`}
                                    href={sellosEnergiaData.wikiUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                  >
                                    <Image
                                      src={sellosEnergiaData.icon}
                                      alt={sellosEnergiaData.name}
                                      width={16}
                                      height={16}
                                      className="inline-block"
                                    />
                                    <span className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
                                      {sellosEnergiaData.name}
                                    </span>
                                  </a>
                                ) : (
                                  <span key={`energy-${index}`} className="text-orange-300 font-semibold">{energyTerm}</span>
                                );
                              } else if (part === cleansingTerm) {
                                return sellosPurificacionData ? (
                                  <a 
                                    key={`cleansing-${index}`}
                                    href={sellosPurificacionData.wikiUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                  >
                                    <Image
                                      src={sellosPurificacionData.icon}
                                      alt={sellosPurificacionData.name}
                                      width={16}
                                      height={16}
                                      className="inline-block"
                                    />
                                    <span className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
                                      {sellosPurificacionData.name}
                                    </span>
                                  </a>
                                ) : (
                                  <span key={`cleansing-${index}`} className="text-orange-300 font-semibold">{cleansingTerm}</span>
                                );
                              } else {
                                return <span key={`text-${index}`}>{part}</span>;
                              }
                            });
                          })()}
                        </p>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {(() => {
                            const text = t('halloween.labyrinth.herald.p4');
                            const normalized = (lang || 'en').toLowerCase();
                            const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
                            
                            // Textos a buscar en cada idioma para "estrellas"
                            const starTerms: Record<string, string> = {
                              'es': 'estrellas',
                              'en': 'Stars',
                              'fr': 'étoiles',
                              'de': 'Sterne'
                            };
                            
                            const starTerm = starTerms[langKey] || starTerms['en'];
                            const parts = text.split(starTerm);
                            
                            return parts.map((part, index, array) => (
                              <span key={index}>
                                {part}
                                {index < array.length - 1 && runaEstrellasData ? (
                                  <a 
                                    href={runaEstrellasData.wikiUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                  >
                                    <Image
                                      src={runaEstrellasData.icon}
                                      alt={runaEstrellasData.name}
                                      width={16}
                                      height={16}
                                      className="inline-block"
                                    />
                                    <span className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
                                      {runaEstrellasData.name}
                                    </span>
                                  </a>
                                ) : (
                                  index < array.length - 1 && (
                                    <span className="text-orange-300 font-semibold">{starTerm}</span>
                                  )
                                )}
                              </span>
                            ));
                          })()}
                        </p>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {(() => {
                            const text = t('halloween.labyrinth.herald.p5');
                            const normalized = (lang || 'en').toLowerCase();
                            const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
                            
                            // Textos a buscar en cada idioma para ambos elementos
                            const speedTerms: Record<string, string> = {
                              'es': 'la de velocidad',
                              'en': 'Speed,',
                              'fr': 'vitesse,',
                              'de': 'Geschwindigkeit,'
                            };
                            
                            const glintTerms: Record<string, string> = {
                              'es': 'Glint, la dragona',
                              'en': 'Glint',
                              'fr': 'Glint',
                              'de': 'Glint'
                            };
                            
                            const speedTerm = speedTerms[langKey] || speedTerms['en'];
                            const glintTerm = glintTerms[langKey] || glintTerms['en'];
                            
                            // Crear un patrón que incluya ambos términos
                            const combinedPattern = new RegExp(`(${speedTerm}|${glintTerm})`, 'g');
                            const parts = text.split(combinedPattern);
                            
                            return parts.map((part, index) => {
                              if (part === speedTerm) {
                                return relicSpeedData ? (
                                  <a 
                                    key={`speed-${index}`}
                                    href={relicSpeedData.wikiUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                  >
                                    <Image
                                      src={relicSpeedData.icon}
                                      alt={relicSpeedData.name}
                                      width={16}
                                      height={16}
                                      className="inline-block"
                                    />
                                    <span className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
                                      {relicSpeedData.name}
                                    </span>
                                  </a>
                                ) : (
                                  <span key={`speed-${index}`} className="text-orange-300 font-semibold">{speedTerm}</span>
                                );
                              } else if (part === glintTerm) {
                                return glintData ? (
                                  <a 
                                    key={`glint-${index}`}
                                    href={glintData.wikiUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                  >
                                    <Image
                                      src={glintData.icon}
                                      alt={glintData.name}
                                      width={16}
                                      height={16}
                                      className="inline-block"
                                    />
                                    <span className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
                                      {glintData.name}
                                    </span>
                                  </a>
                                ) : (
                                  <span key={`glint-${index}`} className="text-orange-300 font-semibold">{glintTerm}</span>
                                );
                              } else {
                                return <span key={`text-${index}`}>{part}</span>;
                              }
                            });
                          })()}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-semibold flex items-center">
                              <span className="text-lg mr-2">⚙️</span>
                              {t('halloween.labyrinth.builds.traitsCode')}
                            </h4>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText('[&DQkDNg8qNBbcEQAABhIAACsSAADUEQAAyhEAAAECAADUESsSBhIAAAAAAAA=]');
                                setShowCopyModal(true);
                                setTimeout(() => setShowCopyModal(false), 2000);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors duration-200"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              {t('halloween.labyrinth.builds.copyCode')}
                            </button>
                          </div>
                          <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-3">
                            <code className="text-orange-300 text-sm font-mono break-all">[&DQkDNg8qNBbcEQAABhIAACsSAADUEQAAyhEAAAECAADUESsSBhIAAAAAAAA=]</code>
                          </div>
                          
                          <div>
                           <Image
                             src="/thumbnails/skills-y-traits-ladron-condi-1-1024x576.webp"
                             alt="Skills y Traits - Temerario Condición"
                             width={1024}
                             height={576}
                             className="w-full h-auto rounded-lg border border-orange-500/30"
                             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                           />
                          </div>
                          <p className="text-gray-200 text-sm leading-relaxed">
                            {(() => {
                              const text = t('halloween.labyrinth.herald.p6');
                              const normalized = (lang || 'en').toLowerCase();
                              const langKey = normalized.startsWith('es') ? 'es' : normalized.startsWith('de') ? 'de' : normalized.startsWith('fr') ? 'fr' : 'en';
                              
                              // Textos a buscar en cada idioma para ambas facetas
                              const facetaElementosTerms: Record<string, string> = {
                                'es': 'elementos',
                                'en': 'Elemental',
                                'fr': 'éléments',
                                'de': 'Elemente'
                              };
                              
                              const facetaCaosTerms: Record<string, string> = {
                                'es': 'caos',
                                'en': 'Chaos',
                                'fr': 'chaos',
                                'de': 'Chaos'
                              };
                              
                              const facetaElementosTerm = facetaElementosTerms[langKey] || facetaElementosTerms['en'];
                              const facetaCaosTerm = facetaCaosTerms[langKey] || facetaCaosTerms['en'];
                              
                              // Crear un patrón que incluya ambos términos
                              const combinedPattern = new RegExp(`(${facetaElementosTerm}|${facetaCaosTerm})`, 'g');
                              const parts = text.split(combinedPattern);
                              
                              return parts.map((part, index) => {
                                if (part === facetaElementosTerm) {
                                  return facetaElementosData ? (
                                    <a 
                                      key={`elementos-${index}`}
                                      href={facetaElementosData.wikiUrl}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                    >
                                      <Image
                                        src={facetaElementosData.icon}
                                        alt={facetaElementosData.name}
                                        width={16}
                                        height={16}
                                        className="inline-block"
                                      />
                                      <span className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
                                        {facetaElementosData.name}
                                      </span>
                                    </a>
                                  ) : (
                                    <span key={`elementos-${index}`} className="text-orange-300 font-semibold">{facetaElementosTerm}</span>
                                  );
                                } else if (part === facetaCaosTerm) {
                                  return facetaCaosData ? (
                                    <a 
                                      key={`caos-${index}`}
                                      href={facetaCaosData.wikiUrl}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                    >
                                      <Image
                                        src={facetaCaosData.icon}
                                        alt={facetaCaosData.name}
                                        width={16}
                                        height={16}
                                        className="inline-block"
                                      />
                                      <span className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
                                        {facetaCaosData.name}
                                      </span>
                                    </a>
                                  ) : (
                                    <span key={`caos-${index}`} className="text-orange-300 font-semibold">{facetaCaosTerm}</span>
                                  );
                                } else {
                                  return <span key={`text-${index}`}>{part}</span>;
                                }
                              });
                            })()}
                          </p>
                          <p className="text-gray-200 text-sm leading-relaxed">{t('halloween.labyrinth.herald.p7')}</p>
                         </div>
                       </div>
                     </div>

                     {/* Información adicional */}
                     <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                       <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                         <Info className="w-5 h-5 mr-2" />
                         {t('halloween.labyrinth.comingSoon.title')}
                       </h3>
                       <p className="text-gray-300 text-sm">
                         {t('halloween.labyrinth.comingSoon.description')}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Routes Section */}
             {selectedSection === 'routes' && (
               <div id="section-routes" className="space-y-8">
                 <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 shadow-2xl">
                   <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                     <Map className="w-6 h-6 mr-3 text-orange-400" />
                    {t('halloween.labyrinth.routes.title')}
                   </h2>
                   
                   <div className="prose prose-invert max-w-none mb-8">
                     <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                    {t('halloween.labyrinth.content.routes')}
                     </p>
                     <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                       {t('halloween.labyrinth.routes.mainRoute.description')}
                     </p>
                     <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                       {t('halloween.labyrinth.routes.clockwiseMovement.description')}
                     </p>
                   </div>

                   <div className="space-y-6">
                     <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                       <h3 className="text-white font-semibold mb-3 flex items-center">
                         <Target className="w-5 h-5 mr-2 text-orange-400" />
                         {t('halloween.labyrinth.routes.taggingConcept.title')}
                       </h3>
                       <p className="text-gray-300 text-sm">
                         {t('halloween.labyrinth.routes.taggingConcept.description')}
                       </p>
                     </div>

                     <div className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-4">
                       <h3 className="text-white font-semibold mb-3 flex items-center">
                         <Map className="w-5 h-5 mr-2 text-green-400" />
                         {t('halloween.labyrinth.routes.labyrinthRoute.title')}
                       </h3>
                       <div className="space-y-3">
                         <div className="flex items-start gap-3">
                           <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                           <div>
                             <h4 className="text-white font-semibold">{t('halloween.labyrinth.routes.clockwiseMovement.title')}</h4>
                             <p className="text-gray-300 text-sm">{t('halloween.labyrinth.routes.clockwiseMovement.description')}</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-3">
                           <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                           <div>
                             <h4 className="text-white font-semibold">{t('halloween.labyrinth.routes.centerEntry.title')}</h4>
                             <p className="text-gray-300 text-sm">{t('halloween.labyrinth.routes.centerEntry.description')}</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-3">
                           <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                           <div>
                             <h4 className="text-white font-semibold">{t('halloween.labyrinth.routes.constantRhythm.title')}</h4>
                             <p className="text-gray-300 text-sm">{t('halloween.labyrinth.routes.constantRhythm.description')}</p>
                           </div>
                         </div>
                       </div>
                       
                       {/* Imagen de la ruta */}
                       <div className="mt-6">
                         <Image
                           src="/thumbnails/ruta-hall.webp"
                           alt="Ruta del Laberinto de Halloween"
                           width={800}
                           height={600}
                           className="w-full h-auto rounded-lg border border-orange-500/30 shadow-lg"
                           onError={(e) => { 
                             console.error('Error loading image:', e);
                             (e.currentTarget as HTMLImageElement).style.display = 'none'; 
                           }}
                         />
                         
                         {/* Nota de traducción para usuarios EN */}
                         <div className="mt-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                           <h4 className="text-blue-300 font-semibold mb-2 flex items-center">
                             <Info className="w-4 h-4 mr-2" />
                             {t('halloween.labyrinth.routes.noteForEnglish.title')}
                           </h4>
                           <p className="text-gray-300 text-sm">
                             {t('halloween.labyrinth.routes.noteForEnglish.description')}
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Consejos detallados del laberinto */}
                     <div className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-4">
                       <h3 className="text-white font-semibold mb-4 flex items-center">
                         <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                      {t('halloween.labyrinth.tips.specific')}
                       </h3>
                       
                       <div className="space-y-4">
                         <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                           <h4 className="text-orange-300 font-semibold mb-2">🎯 {t('halloween.labyrinth.routes.importantDoors.title')}</h4>
                           <p className="text-gray-300 text-sm">
                             {t('halloween.labyrinth.routes.importantDoors.description')}
                           </p>
                         </div>

                         <div className="space-y-3">
                           <div className="flex items-start gap-3">
                             <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                             <div>
                               <h4 className="text-white font-semibold">{t('halloween.labyrinth.routes.mainRoute.title')}</h4>
                               <p className="text-gray-300 text-sm">
                                 {t('halloween.labyrinth.routes.mainRoute.description')}
                               </p>
                             </div>
                           </div>

                           <div className="flex items-start gap-3">
                             <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                             <div>
                               <h4 className="text-white font-semibold">{t('halloween.labyrinth.routes.avoidLegendaries.title')}</h4>
                               <p className="text-gray-300 text-sm">
                                 {t('halloween.labyrinth.routes.avoidLegendaries.description')}
                               </p>
                             </div>
                           </div>

                           <div className="flex items-start gap-3">
                             <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                             <div>
                               <h4 className="text-white font-semibold">{t('halloween.labyrinth.routes.bottomLeftCorner.title')}</h4>
                               <p className="text-gray-300 text-sm">
                                 {t('halloween.labyrinth.routes.bottomLeftCorner.description')}
                               </p>
                             </div>
                           </div>

                           <div className="flex items-start gap-3">
                             <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                             <div>
                               <h4 className="text-white font-semibold">{t('halloween.labyrinth.routes.atDoors.title')}</h4>
                               <p className="text-gray-300 text-sm">
                                 {t('halloween.labyrinth.routes.atDoors.description')}
                               </p>
                             </div>
                           </div>

                           <div className="flex items-start gap-3">
                             <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                             <div>
                               <h4 className="text-white font-semibold">{t('halloween.labyrinth.routes.chainsawSkeleton.title')}</h4>
                               <p className="text-gray-300 text-sm">
                                 {t('halloween.labyrinth.routes.chainsawSkeleton.description')}
                               </p>
                             </div>
                           </div>
                         </div>

                         <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                           <h4 className="text-red-300 font-semibold mb-2">⚠️ {t('halloween.labyrinth.routes.problematicCommanders.title')}</h4>
                           <p className="text-gray-300 text-sm">
                             {t('halloween.labyrinth.routes.problematicCommanders.description')}
                           </p>
                         </div>

                         <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                           <h4 className="text-blue-300 font-semibold mb-2">💡 {t('halloween.labyrinth.routes.finalSummary.title')}</h4>
                           <p className="text-gray-300 text-sm">
                             {t('halloween.labyrinth.routes.finalSummary.description')}
                           </p>
                         </div>
                       </div>
                     </div>

                     <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                       <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                         <Info className="w-5 h-5 mr-2" />
                         {t('halloween.labyrinth.routes.proTip.title')}
                       </h3>
                       <p className="text-gray-300 text-sm">
                         {t('halloween.labyrinth.routes.proTip.description')}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             )}

            {/* Rewards Section */}
            {selectedSection === 'rewards' && (
              <div id="section-rewards" className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <Gift className="w-6 h-6 mr-3 text-orange-400" />
                {t('halloween.labyrinth.rewards.title')}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">{t('halloween.labyrinth.rewards.mainDrops')}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-lg">
                          {trickOrTreatBagsData?.icon ? (
                            <Image
                              src={trickOrTreatBagsData.icon}
                              alt={trickOrTreatBagsData.name || 'Trick-or-Treat Bags'}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-orange-400" />
                          )}
                          <div>
                            <h4 className="text-white font-semibold">
                              {trickOrTreatBagsData ? (
                                <a href={trickOrTreatBagsData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-orange-200 no-underline">
                                  {trickOrTreatBagsData.name}
                                </a>
                              ) : (
                                'Trick-or-Treat Bags'
                              )}
                            </h4>
                            <p className="text-gray-300 text-sm">{t('halloween.labyrinth.rewards.trickOrTreatBags.description', 'El drop más común y valioso. Contiene materiales de Halloween.')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-lg">
                          {candyCornData?.icon ? (
                            <Image
                              src={candyCornData.icon}
                              alt={candyCornData.name || 'Candy Corn'}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                          ) : (
                            <Coins className="w-5 h-5 text-yellow-400" />
                          )}
                          <div>
                            <h4 className="text-white font-semibold">
                              {candyCornData ? (
                                <a href={candyCornData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-200 no-underline">
                                  {candyCornData.name}
                                </a>
                              ) : (
                                'Candy Corn'
                              )}
                            </h4>
                            <p className="text-gray-300 text-sm">{t('halloween.labyrinth.rewards.candyCorn.description', 'Moneda especial de Halloween para comprar items exclusivos.')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-lg">
                          <Star className="w-5 h-5 text-purple-400" />
                          <div>
                            <h4 className="text-white font-semibold">{t('halloween.labyrinth.rewards.rareItems.title', 'Items Raros')}</h4>
                            <p className="text-gray-300 text-sm">{t('halloween.labyrinth.rewards.rareItems.description', 'Ocasionalmente puedes obtener items muy valiosos como infusiones.')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Advanced Tips Section */}
            {selectedSection === 'advanced' && (
              <div id="section-advanced" className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-3 text-orange-400" />
                  {t('halloween.labyrinth.advanced.title')}
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Maximizar Eficiencia */}
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <Zap className="w-6 h-6 mr-2 text-purple-400" />
                    {t('halloween.labyrinth.advanced.maximizeEfficiency.title')}
                      </h3>
                      <p className="text-gray-300 mb-6">
                    {t('halloween.labyrinth.advanced.maximizeEfficiency.description')}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Boosters Principales */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-purple-300 mb-3">
                        {t('halloween.labyrinth.advanced.mainBoosters.title')}
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {blackLionBoostData?.icon && (
                                    <Image
                                      src={blackLionBoostData.icon}
                                      alt={blackLionBoostData.name || 'Potenciador del León Negro'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {blackLionBoostData ? (
                                      <a href={blackLionBoostData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 no-underline">
                                        {blackLionBoostData.name}
                                      </a>
                                    ) : (
                                      <span className="text-purple-300">{t('halloween.labyrinth.advanced.blackLionBoost.fallback')}</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">{t('halloween.labyrinth.advanced.blackLionBoost.description')}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {experienceBoostData?.icon && (
                                    <Image
                                      src={"https://wiki.guildwars2.com/images/6/6a/Experience_Bonus_%28fifty_percent%29.png"}
                                      alt={t('halloween.labyrinth.advanced.experienceBonus.alt')}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    <a href={lang === 'es' ? 'https://wiki-es.guildwars2.com/wiki/50%25_de_bonificaci%C3%B3n_de_experiencia' : 
                                       lang === 'fr' ? 'https://wiki-fr.guildwars2.com/wiki/Bonus_d\'exp%C3%A9rience_50%25' : 
                                       lang === 'de' ? 'https://wiki-de.guildwars2.com/wiki/50%25_Erfahrungsbonus' : 
                                       'https://wiki.guildwars2.com/wiki/50%25_Experience_Bonus'} 
                                       target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 no-underline">
{t('halloween.labyrinth.advanced.experienceBonus.alt')}
                                    </a>
                                  </h5>
                                </div>
                                <div className="flex items-center gap-2">
                                  {communalBonfireData?.icon && (
                                    <Image
                                      src={communalBonfireData.icon}
                                      alt={communalBonfireData.name || 'Communal Boost Bonfire'}
                                      width={20}
                                      height={20}
                                      className="rounded"
                                    />
                                  )}
                                  <p className="text-gray-300 text-sm">
                                    {lang === 'es' ? `50% de bonificación extra de ganancia de experiencia. Se obtiene de la ${communalBonfireData?.name || 'Communal Boost Bonfire'}.` : 
                                     lang === 'fr' ? `50% de bonus supplémentaire de gain d'expérience. Obtenu de la ${communalBonfireData?.name || 'Communal Boost Bonfire'}.` : 
                                     lang === 'de' ? `50% zusätzlicher Erfahrungsbonus-Gewinn. Erhalten von der ${communalBonfireData?.name || 'Communal Boost Bonfire'}.` : 
                                     `50% extra experience bonus gain. Obtained from the ${communalBonfireData?.name || 'Communal Boost Bonfire'}.`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <Image
                                    src="https://wiki.guildwars2.com/images/4/44/Active_Kill_Streak%21.png"
                                    alt={t('halloween.labyrinth.advanced.killStreak.alt')}
                                    width={32}
                                    height={32}
                                    className="rounded"
                                  />
                                  <h5 className="text-white font-semibold">
                                    <a href="https://wiki.guildwars2.com/wiki/Active_Kill_Streak!" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 no-underline">
{t('halloween.labyrinth.advanced.killStreak.alt')}
                                    </a>
                                  </h5>
                                </div>
                                <div className="flex items-center gap-2">
                                  {zampacaramelosData?.icon && (
                                    <Image
                                      src={zampacaramelosData.icon}
                                      alt={zampacaramelosData.name || 'Zampacaramelos'}
                                      width={20}
                                      height={20}
                                      className="rounded"
                                    />
                                  )}
                                  <p className="text-gray-300 text-sm">
                                    {lang === 'es' ? `10% extra de experiencia por cada carga (hasta 10 cargas). Se obtiene del ${zampacaramelosData?.name || 'Zampacaramelos'}.` : 
                                     lang === 'fr' ? `10% d'expérience supplémentaire par pile (jusqu'à 10 piles). Obtenu du ${zampacaramelosData?.name || 'Zampacaramelos'}.` : 
                                     lang === 'de' ? `10% zusätzliche Erfahrung pro Stapel (bis zu 10 Stapel). Erhalten vom ${zampacaramelosData?.name || 'Zampacaramelos'}.` : 
                                     `10% extra experience per stack (up to 10 stacks). Obtained from ${zampacaramelosData?.name || 'Zampacaramelos'}.`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {item20002Data?.icon && (
                                    <Image
                                      src={item20002Data.icon}
                                      alt={item20002Data.name || 'Potenciador de Experiencia'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {item20002Data ? (
                                      <a href={item20002Data.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 no-underline">
                                        {item20002Data.name}
                                      </a>
                                    ) : (
                                      <span className="text-purple-300">{t('halloween.labyrinth.advanced.experienceBooster.fallback')}</span>
                                    )}
                                  </h5>
                                </div>
                                <div className="flex items-center gap-2">
                                  {zampacaramelosData?.icon && (
                                    <Image
                                      src={zampacaramelosData.icon}
                                      alt={zampacaramelosData.name || 'ZampaZaithanmelos'}
                                      width={20}
                                      height={20}
                                      className="rounded"
                                    />
                                  )}
                                <p className="text-gray-300 text-sm">
                                  {lang === 'es' ? `50% de experiencia extra. Se consigue principalmente del ${zampacaramelosData?.name || 'ZampaZaithanmelos'}` : 
                                   lang === 'fr' ? `50% d'expérience supplémentaire. Principalement obtenu du ${zampacaramelosData?.name || 'ZampaZaithanmelos'}` : 
                                   lang === 'de' ? `50% zusätzliche Erfahrung. Hauptsächlich erhalten vom ${zampacaramelosData?.name || 'ZampaZaithanmelos'}` : 
                                   `50% extra experience. Mainly obtained from ${zampacaramelosData?.name || 'ZampaZaithanmelos'}`}
                                </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {celebrationBoostData?.icon && (
                                    <Image
                                      src={celebrationBoostData.icon}
                                      alt={celebrationBoostData.name || 'Potenciador de Celebración'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {celebrationBoostData ? (
                                      <a href={celebrationBoostData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 no-underline">
                                        {celebrationBoostData.name}
                                      </a>
                                    ) : (
                                      <span className="text-purple-300">{t('halloween.labyrinth.advanced.celebrationBoost.fallback')}</span>
                                    )}
                                  </h5>
                                </div>
                                  <p className="text-gray-300 text-sm">{t('halloween.labyrinth.advanced.celebrationBoost.description')}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Comida y Mejoras */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-purple-300 mb-3">
                        {t('halloween.labyrinth.advanced.foodAndEnhancements.title')}
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {strawberryGhostData?.icon && (
                                    <Image
                                      src={strawberryGhostData.icon}
                                      alt={strawberryGhostData.name || 'Comida'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {strawberryGhostData ? (
                                      <a href={strawberryGhostData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-green-300 hover:text-green-200 no-underline">
                                        {strawberryGhostData.name}
                                      </a>
                                    ) : (
                                      <span className="text-green-300">{t('halloween.labyrinth.advanced.food.fallback')}</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">{t('halloween.labyrinth.advanced.food.description')}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {chatoyantElixirData?.icon && (
                                    <Image
                                      src={chatoyantElixirData.icon}
                                      alt={chatoyantElixirData.name || 'Mejora'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {chatoyantElixirData ? (
                                      <a href={chatoyantElixirData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-green-300 hover:text-green-200 no-underline">
                                        {chatoyantElixirData.name}
                                      </a>
                                    ) : (
                                      <span className="text-green-300">{t('halloween.labyrinth.advanced.enhancement.fallback')}</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">{t('halloween.labyrinth.advanced.enhancement.description')}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {wintersBlessingData?.icon && (
                                    <Image
                                      src={wintersBlessingData.icon}
                                      alt={wintersBlessingData.name || 'Bendición Invernal'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {wintersBlessingData ? (
                                      <a href={wintersBlessingData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 no-underline">
                                        {wintersBlessingData.name}
                                      </a>
                                    ) : (
                                      <span className="text-blue-300">{t('halloween.labyrinth.advanced.wintersBlessing.fallback')}</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">{t('halloween.labyrinth.advanced.wintersBlessing.description')}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {luckyDraketailData?.icon && (
                                    <Image
                                      src={luckyDraketailData.icon}
                                      alt={luckyDraketailData.name || 'Don de año nuevo'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {luckyDraketailData ? (
                                      <a href={luckyDraketailData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 no-underline">
                                        {luckyDraketailData.name}
                                      </a>
                                    ) : (
                                      <span className="text-blue-300">Don de año nuevo</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">5% de experiencia al usar petardos del año nuevo lunar.</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {luckyFirecrackerData?.icon && (
                                    <Image
                                      src={luckyFirecrackerData.icon}
                                      alt={luckyFirecrackerData.name || 'Bonificación de año nuevo'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {luckyFirecrackerData ? (
                                      <a href={luckyFirecrackerData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 no-underline">
                                        {luckyFirecrackerData.name}
                                      </a>
                                    ) : (
                                      <span className="text-blue-300">Bonificación de año nuevo</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">10% de experiencia. Se consigue con objeto especial del año nuevo lunar.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Boosters de Festival */}
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-orange-300 mb-3">
{t('halloween.labyrinth.advanced.festivalBoosters.title')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {festivalGobblerBoostData?.icon && (
                                    <Image
                                      src={festivalGobblerBoostData.icon}
                                      alt={festivalGobblerBoostData.name || 'Potenciador de zampador de festival'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {festivalGobblerBoostData ? (
                                      <a href={festivalGobblerBoostData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-orange-200 no-underline">
                                        {festivalGobblerBoostData.name}
                                      </a>
                                    ) : (
                                      <span className="text-orange-300">Potenciador de zampador de festival</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  {lang === 'es' ? '25% de experiencia extra. Se obtiene con copos de nueve en el ' : 
                                   lang === 'fr' ? '25% d\'expérience supplémentaire. Obtenu avec des flocons de neige dans le ' : 
                                   lang === 'de' ? '25% zusätzliche Erfahrung. Erhalten mit Schneeflocken im ' : 
                                   '25% extra experience. Obtained with snowflakes in '}
                                  {zampacoposData ? (
                                    <a href={zampacoposData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-orange-200 no-underline inline-flex items-center gap-1">
                                      {zampacoposData.icon && (
                                        <Image
                                          src={zampacoposData.icon}
                                          alt={zampacoposData.name}
                                          width={16}
                                          height={16}
                                          className="rounded"
                                        />
                                      )}
                                      {zampacoposData.name}
                                    </a>
                                  ) : (
                                    <span className="text-orange-300">Zampacopos</span>
                                  )}
                                  {lang === 'es' ? ' o ' : 
                                   lang === 'fr' ? ' ou ' : 
                                   lang === 'de' ? ' oder ' : 
                                   ' or '}
                                  {zampazaithanmelosData ? (
                                    <a href={zampazaithanmelosData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-orange-200 no-underline inline-flex items-center gap-1">
                                      {zampazaithanmelosData.icon && (
                                        <Image
                                          src={zampazaithanmelosData.icon}
                                          alt={zampazaithanmelosData.name}
                                          width={16}
                                          height={16}
                                          className="rounded"
                                        />
                                      )}
                                      {zampazaithanmelosData.name}
                                    </a>
                                  ) : (
                                    <span className="text-orange-300">ZampaZaithanmelos</span>
                                  )}
                                  {lang === 'es' ? '.' : 
                                   lang === 'fr' ? '.' : 
                                   lang === 'de' ? '.' : 
                                   '.'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {guildExperienceBannerData?.icon && (
                                    <Image
                                      src={guildExperienceBannerData.icon}
                                      alt={guildExperienceBannerData.name || 'Bonificador de estandarte de experiencia del clan'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {guildExperienceBannerData ? (
                                      <a href={guildExperienceBannerData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-orange-200 no-underline">
                                        {guildExperienceBannerData.name}
                                      </a>
                                    ) : (
                                      <span className="text-orange-300">Bonificador de estandarte de experiencia del clan</span>
                                    )}
                                  </h5>
                                </div>
                                  <p className="text-gray-300 text-sm">{lang === 'es' ? '15% extra de experiencia. Se obtiene usando estandarte del clan o de aniversario.' : 
                                   lang === 'fr' ? '15% d\'expérience supplémentaire. Obtenu en utilisant le bannière de guilde ou d\'anniversaire.' : 
                                   lang === 'de' ? '15% zusätzliche Erfahrung. Erhalten durch Verwenden des Gilden-Banners oder des Jubiläums-Banners.' : 
                                   '15% extra experience. Obtained by using the guild banner or anniversary banner.'}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {guildXPGainData?.icon && (
                                    <Image
                                      src={guildXPGainData.icon}
                                      alt={guildXPGainData.name || 'Ganancia de PE del clan'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {guildXPGainData ? (
                                      <a href={guildXPGainData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-orange-200 no-underline">
                                        {guildXPGainData.name}
                                      </a>
                                    ) : (
                                      <span className="text-orange-300">Ganancia de PE del clan</span>
                                    )}
                                  </h5>
                                </div>
                                    <p className="text-gray-300 text-sm">
                                      {lang === 'es' ? '10% de experiencia extra. Se consigue con poción de clan.' : 
                                       lang === 'fr' ? '10% d\'expérience supplémentaire. Obtenu avec la potion de clan.' : 
                                       lang === 'de' ? '10% zusätzliche Erfahrung. Erhalten mit der Clan-Potion.' : 
                                       '10% extra experience. Obtained with the clan potion.'}
                                    </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {experiencedEnrichmentData?.icon && (
                                    <Image
                                      src={experiencedEnrichmentData.icon}
                                      alt={experiencedEnrichmentData.name || 'Enriquecimiento de experiencia'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {experiencedEnrichmentData ? (
                                      <a href={experiencedEnrichmentData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-200 no-underline">
                                        {experiencedEnrichmentData.name}
                                      </a>
                                    ) : (
                                      <span className="text-yellow-300">Enriquecimiento de experiencia</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  {lang === 'es' ? '20% extra de experiencia. Infusión para amuletos. Se consigue en mercaderes de laureles.' : 
                                   lang === 'fr' ? '20% d\'expérience supplémentaire. Infusion pour amulettes. Obtenu dans les marchands de lauriers.' : 
                                   lang === 'de' ? '20% zusätzliche Erfahrung. Infusion für Amulette. Erhalten bei Händlern von Lorbeerblättern.' : 
                                   '20% extra experience. Infusion for amulets. Obtained at laurel merchants.'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {enlightenmentData?.icon && (
                                    <Image
                                      src={enlightenmentData.icon}
                                      alt={enlightenmentData.name || 'Iluminación'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {enlightenmentData ? (
                                      <a href={enlightenmentData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-200 no-underline">
                                        {enlightenmentData.name}
                                      </a>
                                    ) : (
                                      <span className="text-yellow-300">Iluminación</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">{lang === 'es' ? '20% extra de experiencia durante 6 horas. Se consigue completando el corazón de entrenamiento del monasterio de Seitung.' : 
                                 lang === 'fr' ? '20% d\'expérience supplémentaire pendant 6 heures. Obtenu en complétant le cœur d\'entraînement du monastère de Seitung.' : 
                                 lang === 'de' ? '20% zusätzliche Erfahrung während 6 Stunden. Erhalten durch Vervollständigen des Trainingskreises des Seitung-Monastärs.' : 
                                 '20% extra experience for 6 hours. Obtained by completing the training heart of the Seitung monastery.'}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {ancientCanthanSecretData?.icon && (
                                    <Image
                                      src={ancientCanthanSecretData.icon}
                                      alt={ancientCanthanSecretData.name || 'Antiguo Secreto Canthaino'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {ancientCanthanSecretData ? (
                                      <a href={ancientCanthanSecretData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-200 no-underline">
                                        {ancientCanthanSecretData.name}
                                      </a>
                                    ) : (
                                      <span className="text-yellow-300">Antiguo Secreto Canthaino</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">{lang === 'es' ? '20% extra de experiencia durante 1 hora. Se compra en el mismo corazón de Seitung. 24 por día.' : 
                                 lang === 'fr' ? '20% d\'expérience supplémentaire pendant 1 heure. Acheté au même cœur de Seitung. 24 par jour.' : 
                                 lang === 'de' ? '20% zusätzliche Erfahrung während 1 Stunde. Gekauft im selben Trainingskreis von Seitung. 24 pro Tag.' : 
                                 '20% extra experience for 1 hour. Purchased at the same training heart of Seitung. 24 per day.'}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {restingData?.icon && (
                                    <Image
                                      src={restingData.icon}
                                      alt={restingData.name || 'Descanso'}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <h5 className="text-white font-semibold">
                                    {restingData ? (
                                      <a href={restingData.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-200 no-underline">
                                        {restingData.name}
                                      </a>
                                    ) : (
                                      <span className="text-yellow-300">Descanso</span>
                                    )}
                                  </h5>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  {lang === 'es' ? 'Hasta 25% extra de experiencia durante 4 horas. Se obtiene dejando descansar el personaje en Piedra Arbórea, Torre del Brujo y Heredad.' : 
                                   lang === 'fr' ? 'Jusqu\'à 25% d\'expérience supplémentaire pendant 4 heures. Obtenu en laissant le personnage se reposer sur la Pierre Arborea, La Tour du sorcier et Pavillon.' : 
                                   lang === 'de' ? 'Bis zu 25% zusätzliche Erfahrung während 4 Stunden. Erhalten durch Lassen des Charakters in der Arborstein, Der Turm des Zauberers und Heimstätte.' : 
                                   'Up to 25% extra experience for 4 hours. Obtained by leaving the character to rest on the Arborstone, the Witch\'s Tower and  Homesteads.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Consejo Final */}
                      <div className="mt-6 bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-lg p-4">
                        <h4 className="text-orange-300 font-semibold mb-2 flex items-center">
                          <Zap className="w-5 h-5 mr-2" />
{t('halloween.labyrinth.advanced.maximumEfficiencyTip.title')}
                        </h4>
                        <p className="text-gray-300 text-sm">
{t('halloween.labyrinth.advanced.maximumEfficiencyTip.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modal de confirmación de copia */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900/95 backdrop-blur-md rounded-lg p-6 border border-orange-500/30 shadow-2xl max-w-sm w-full"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('halloween.labyrinth.builds.codeCopied')}</h3>
              <p className="text-gray-300 text-sm">
                {t('halloween.labyrinth.builds.codeCopiedDescription')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default LabyrinthGuidePage;