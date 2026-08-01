/** ponytail: smoke — remnant toggle + armor weight + shopping list */
import assert from 'node:assert/strict';
import {
  armorWeight,
  buildTree,
  isRepurchaseItem,
  legendaryData,
  shoppingList,
  STANDING_STONES_TIMEPIECE_ID,
  VALKYRIE_BEARKIN_WAR_HELM_ID,
} from '../src/lib/legendary-tree.ts';

assert.equal(isRepurchaseItem(STANDING_STONES_TIMEPIECE_ID), true);
assert.equal(isRepurchaseItem(VALKYRIE_BEARKIN_WAR_HELM_ID), true);

const klob = legendaryData.legendaries.find((l) => /Klobjarne/i.test(l.name));
assert.ok(klob, 'Klobjarne legendary missing');

const asAch = buildTree(legendaryData, klob.id, {}, { overrides: {} });
const timepiece = shoppingList(asAch.root); // empty if achievement path
assert.ok(asAch.root);

const asBuy = buildTree(legendaryData, klob.id, { 68063: { buy: 100, sell: 100 } }, {
  overrides: {
    [STANDING_STONES_TIMEPIECE_ID]: 'buy',
    [VALKYRIE_BEARKIN_WAR_HELM_ID]: 'buy',
  },
});
assert.ok(asBuy.total > 0, 'remnant path should cost amalgamated gold');

const armor = legendaryData.legendaries.find((l) => (l.kind ?? '') === 'armor');
if (armor) assert.ok(armorWeight(armor) !== undefined);

console.log('ok', { achGold: asAch.total, buyGold: asBuy.total });
