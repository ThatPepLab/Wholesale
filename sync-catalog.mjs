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
const excludedProducts = new Set(["hexarelin acetate"]);
const twoVialPackProducts = new Set(["nandrolone decanoate","boldenone undecylenate","nandrolone phenylpropionate","methenolone enanthate","testosterone cypionate","testosterone enanthate","testosterone propionate","trenbolone acetate","trenbolone enanthate"]);
const tabletProducts = new Set(["arimidex","clenbuterol","clomid","dianabol 20","aromasin","cialis","viagra","turanabol","winstrol 10"]);
const retailBacPricePerVial = 10;

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

function extrapolatedTenVialLandedCost(offer) {
  const rule = rules[offer.vendor] || { ship: 0 };
  const packsNeeded = 10 / Number(offer.vials);
  const subtotal = offer.price * packsNeeded;
  const discountedPrice = subtotal * (1 - discountRate(rule, subtotal));
  const shipping = rule.freeAt && subtotal >= rule.freeAt ? 0 : Number(rule.ship) || 0;
  return discountedPrice + shipping;
}

function wholesaleKitPrice(averageLandedCost) {
  const markedUpSingleVial = (averageLandedCost / 10) * 3.5;
  return roundToFive((markedUpSingleVial + 10) * 3 * 0.9);
}

function wholesaleSpecialPackPrice(averageLandedCost) {
  return roundToFive(averageLandedCost);
}

function singleVialMsrp(averageLandedCost) {
  return roundToFive((averageLandedCost / 10) * 3.5) + 10;
}

function retailTiers(averageLandedCost) {
  const rawSingleWithBac = (averageLandedCost / 10) * 3.5 + retailBacPricePerVial;
  return {
    one: Math.max(0, roundToFive(rawSingleWithBac) - retailBacPricePerVial),
    three: Math.max(0, roundToFive(rawSingleWithBac * 3 * 0.9) - retailBacPricePerVial * 3),
    five: Math.max(0, roundToFive(rawSingleWithBac * 5 * 0.85) - retailBacPricePerVial * 5),
    ten: Math.max(0, roundToFive(rawSingleWithBac * 10 * 0.8) - retailBacPricePerVial * 10),
  };
}

function unpreparedRetailTiers(averageLandedCost, packSize) {
  const one = roundToFive((averageLandedCost / packSize) * 3.5);
  return {
    one,
    three: roundToFive(one * 3 * 0.9),
    five: roundToFive(one * 5 * 0.85),
    ten: roundToFive(one * 10 * 0.8),
  };
}

const groups = new Map();
for (const offer of offers.filter((item) => {
  const productName = String(item.product || "").trim().toLowerCase();
  const supportedPack = item.vials === 10 || (item.vials === 2 && twoVialPackProducts.has(productName)) || (item.vials === 100 && tabletProducts.has(productName));
  return supportedPack && !excludedProducts.has(productName);
})) {
  const key = `${offer.product}\u0000${offer.strength}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(offer);
}

const products = new Map();
for (const [key, matchingOffers] of groups) {
  const [name, strength] = key.split("\u0000");
  const landedPrices = matchingOffers.map(landedCost);
  const highestLandedCost = Math.max(...landedPrices);
  const lowestLandedCost = Math.min(...landedPrices);
  const averageLandedCost = (highestLandedCost + lowestLandedCost) / 2;
  if (!products.has(name)) products.set(name, { name, items: [] });
  const productName = name.trim().toLowerCase();
  const isOilPack = twoVialPackProducts.has(productName) && matchingOffers.every((offer) => offer.vials === 2);
  const isTabletPack = tabletProducts.has(productName) && matchingOffers.every((offer) => offer.vials === 100);
  const packSize = isOilPack ? 2 : isTabletPack ? 100 : 10;
  const oilTenVialLandedPrices = isOilPack ? matchingOffers.map(extrapolatedTenVialLandedCost) : [];
  const oilAverageTenVialCost = isOilPack
    ? (Math.max(...oilTenVialLandedPrices) + Math.min(...oilTenVialLandedPrices)) / 2
    : 0;
  const oilCostPerVial = isOilPack ? oilAverageTenVialCost / 10 : 0;
  products.get(name).items.push({
    strength,
    packSize,
    packageUnit: isTabletPack ? "tablet" : "vial",
    price: isOilPack ? roundToFive(oilCostPerVial * packSize) : isTabletPack ? wholesaleSpecialPackPrice(averageLandedCost) : wholesaleKitPrice(averageLandedCost),
    msrp: isTabletPack ? roundToFive(averageLandedCost * 3.5) : isOilPack ? roundToFive(oilCostPerVial * 3.5) : singleVialMsrp(averageLandedCost),
    retail: isOilPack ? unpreparedRetailTiers(oilAverageTenVialCost, 10) : retailTiers(averageLandedCost),
    usAvailable: matchingOffers.some((offer) => /US Warehouse/i.test(offer.vendor) && !/out of stock/i.test(offer.note || "")),
  });
}

const catalog = [...products.values()]
  .map((product) => ({
    ...product,
    items: product.items.sort((a, b) => numericStrength(a.strength) - numericStrength(b.strength)),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated ${catalog.length} products from ${offers.length} TPLPrice offers using the average of highest and lowest landed cost.`);
