export function getImageSrc(icon: string): string {
  if (icon === 'magic-mirror') {
    return 'https://wiki.guildwars2.com/images/1/1d/Magic_Mirror.png';
  }
  if (icon === 'garden') {
    return 'https://wiki.guildwars2.com/images/2/2d/Plant_resource_%28map_icon%29.png';
  }
  if (icon === 'legendary-crafting') {
    return 'https://wiki.guildwars2.com/images/e/ee/Legendary_Crafting.png';
  }

  const isAssetsIcon =
    icon === 'GOM' ||
    icon === 'GOJM' ||
    icon === 'Glosary' ||
    icon === 'Community' ||
    icon === 'conversion-guide' ||
    icon === 'conversionlodestone' ||
    icon === 'Explorer';
  const isFestivalIcon = icon === 'Shadow_of_the_Mad_King';

  const folder = isAssetsIcon ? 'assets' : isFestivalIcon ? 'festivals' : 'expansions';
  const extension = icon === 'conversion-guide' || icon === 'conversionlodestone' ? 'gif' : 'webp';
  const query = icon === 'Explorer' ? '?v=2' : '';

  return `/images/${folder}/${icon}.${extension}${query}`;
}

export function isImageUnoptimized(icon: string): boolean {
  return (
    icon === 'magic-mirror' ||
    icon === 'legendary-crafting' ||
    icon === 'conversionlodestone' ||
    icon === 'conversion-guide' ||
    icon === 'garden'
  );
}
