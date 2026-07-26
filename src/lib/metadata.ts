// ponytail: SEO titles without next/Metadata types

const slogans = [
  'Passion for gold',
  'Gold - Today and tomorrow',
  'Gold is my passion',
  'True Farming Saves Your Time',
  'We use real data, not like others',
  'The art of True Farming',
  'All you need is True Farming',
  'Real Farming? It must be like True Data',
  "Don't Say Fast, Say True",
  "The gold don't wait people",
  "My Doctor Says 'A good farmer is a true farmer'",
  "600g/h? We show you that doesn't exist!",
  `True Farming: 2 + 2 = 4
  Other webs: 2 + 2 = 84`,
];

export function getRandomSlogan(): string {
  return slogans[Math.floor(Math.random() * slogans.length)];
}

export type PageMeta = {
  title: string;
  description: string;
};

export function buildPageMeta(pathname = '/'): PageMeta {
  const slogan = getRandomSlogan();
  const title =
    pathname === '/'
      ? 'True Farming - Guild Wars 2'
      : `${pathname.replace(/^\//, '')} - True Farming - Guild Wars 2`;
  return {
    title,
    description: `${slogan} - Your platform to optimize farming in Guild Wars 2`,
  };
}

/** @deprecated kept name for any leftover imports */
export async function generateDynamicMetadata(): Promise<PageMeta> {
  return buildPageMeta('/');
}
