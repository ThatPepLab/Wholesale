import fs from "node:fs";

const sourcePath = process.argv[2] || "_tplprice/index.html";
const outputPath = process.argv[3] || "catalog-data.json";
const html = fs.readFileSync(sourcePath, "utf8");
const offersStart = html.indexOf("const OFFERS=");
const rulesStart = html.indexOf("const RULES=", offersStart);
const rulesEnd = html.indexOf("let cart=", rulesStart);

if (offersStart < 0 || rulesStart < 0 || rulesEnd < 0) {
  throw new Error("TPLPrice product or landed-cost data could not be found.");
}

const offersJson = html
  .slice(offersStart + "const OFFERS=".length, rulesStart)
  .trim()
  .replace(/;$/, "");
const rulesSource = html
  .slice(rulesStart + "const RULES=".length, rulesEnd)
  .trim()
  .replace(/;$/, "");
const offers = JSON.parse(offersJson);
const rules = Function(`"use strict"; return (${rulesSource});`)();
const roundToFive = (amount) => Math.ceil(amount / 5) * 5;
const numericStrength = (strength) => Number.parseFloat(strength) || 0;

function discountRate(rule, subtotal, useCrypto = true) {
  let rate = rule.baseDiscount || 0;
  if (useCrypto && rule.crypto) rate = Math.max(rate, rule.crypto);
  for (const tier of rule.tiers || []) if (subtotal >= tier.at) rate = Math.max(rate, tier.rate);
  if (useCrypto) for (const tier of rule.cryptoTiers || []) if (subtotal >= tier.at) rate = Math.max(rate, tier.rate);
  return rate;
}

function landedCost(offer) {
  const rule = rules[offer.vendor] || { ship: 0 };
  const discountedPrice = offer.price * (1 - discountRate(rule, offer.price));
  const shipping = rule.freeAt && offer.price >= rule.freeAt ? 0 : Number(rule.ship) || 0;
  return discountedPrice + shipping;
}

function wholesaleKitPrice(highestLandedCost) {
  const markedUpSingleVial = (highestLandedCost / 10) * 3.5;
  return roundToFive((markedUpSingleVial + 10) * 3 * 0.9);
}

function singleVialMsrp(highestLandedCost) {
  return roundToFive((highestLandedCost / 10) * 3.5) + 10;
}

function retailTiers(highestLandedCost) {
  const rawSingle = (highestLandedCost / 10) * 3.5 + 10;
  return {
    one: roundToFive(rawSingle),
    three: wholesaleKitPrice(highestLandedCost),
    five: roundToFive(rawSingle * 5 * 0.85),
    ten: roundToFive(rawSingle * 10 * 0.8),
  };
}

const groups = new Map();
for (const offer of offers.filter((item) => item.vials === 10)) {
  const key = `${offer.product}\u0000${offer.strength}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(offer);
}

const products = new Map();
for (const [key, matchingOffers] of groups) {
  const [name, strength] = key.split("\u0000");
  const highestLandedCost = Math.max(...matchingOffers.map(landedCost));
  if (!products.has(name)) products.set(name, { name, items: [] });
  products.get(name).items.push({
    strength,
    price: wholesaleKitPrice(highestLandedCost),
    msrp: singleVialMsrp(highestLandedCost),
    retail: retailTiers(highestLandedCost),
    usAvailable: matchingOffers.some((offer) => /US Warehouse/i.test(offer.vendor)),
  });
}

const catalog = [...products.values()]
  .map((product) => ({
    ...product,
    items: product.items.sort((a, b) => numericStrength(a.strength) - numericStrength(b.strength)),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated ${catalog.length} products from ${offers.length} TPLPrice offers using highest landed cost.`);
