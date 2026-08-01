import assert from 'node:assert/strict';
import {
  legendaryData,
  buildTree,
  shoppingList,
  flattenTree,
  itemMeta,
} from '../src/lib/legendary-tree.ts';

assert.equal(legendaryData.recipes['46746']?.ingredients?.length, 4); // API 7311

const prices = {
  46731: { buy: 10, sell: 12 },
  46733: { buy: 10, sell: 12 },
  46735: { buy: 10, sell: 12 },
  46747: { buy: 100, sell: 120 },
};

// solo Vision Crystal ×6 (como la query del wiki)
const t = buildTree(legendaryData, 46746, prices, { quantity: 6 });
const mats = shoppingList(t.root);
const need = (id) => mats.find((m) => m.id === id)?.need ?? 0;
const acc = (id) => t.accountRequirements.find((a) => a.id === id)?.count ?? 0;

const dust = need(46731);
const ore = need(46733);
const frag = need(46735);
const thermo = need(46747);
const augur = acc(46752);
const brick = acc(46730) + need(46730);
const obsKarma = t.currencyRequirements.find((c) => c.id === 2)?.needed ?? 0;

console.log({ dust, ore, frag, thermo, augur, brick, obsKarma, mats: mats.map((m) => `${need(m.id)} ${itemMeta(legendaryData, m.id).name}`) });

// wiki: https://wiki.guildwars2.com/wiki/Special:RunQuery/Base_ingredients_query (6 × Vision Crystal / 7311)
assert.equal(dust, 3000, `dust ${dust}`);
assert.equal(ore, 3000, `ore ${ore}`);
assert.equal(frag, 3000, `frag ${frag}`);
assert.equal(thermo, 900, `thermo ${thermo}`);
assert.equal(augur, 6, `augur ${augur}`);
assert.equal(brick, 0, `bricks ${brick}`);
assert.equal(obsKarma, 180 * 2100, `obs karma ${obsKarma}`);

console.log('ok vision crystal base ingredients match wiki ×6');
