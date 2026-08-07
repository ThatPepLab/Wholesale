import fs from "node:fs";

const sourcePath = process.argv[2] || "_tplprice/index.html";
const outputPath = process.argv[3] || "catalog-data.json";
const html = fs.readFileSync(sourcePath, "utf8");
const offersStart = html.indexOf("const OFFERS=");
const rulesStart = html.indexOf("const RULES=", offersStart);

if (offersStart < 0 || rulesStart < 0) {
  throw new Error("TPLPrice product data could not be found.");
}

const offersJson = html
  .slice(offersStart + "const OFFERS=".length, rulesStart)
  .trim()
  .replace(/;$/, "");
const offers = JSON.parse(offersJson);
const roundToFive = (amount) => Math.ceil(amount / 5) * 5;
const numericStrength = (strength) => Number.parseFloat(strength) || 0;

function wholesaleKitPrice(highestKitCost) {
  const markedUpSingleVial = (highestKitCost / 10) * 3.5;
  return roundToFive((markedUpSingleVial + 10) * 3 * 0.9);
}

function singleVialMsrp(highestKitCost) {
  return roundToFive((highestKitCost / 10) * 3.5) + 10;
}

function retailTiers(highestKitCost) {
  const rawSingle = (highestKitCost / 10) * 3.5 + 10;
  return {
    one: roundToFive(rawSingle),
    three: wholesaleKitPrice(highestKitCost),
    five: roundToFive(rawSingle * 5 * 0.85),
    ten: roundToFive(rawSingle * 10 * 0.8),
  };
}

const groups = new Map();
for (const offer of offers.filter((item) => item.vials === 10)) {
  const region = /US Warehouse/i.test(offer.vendor) ? "usa" : "china";
  const key = `${offer.product}\u0000${offer.strength}\u0000${region}`;
  groups.set(key, Math.max(groups.get(key) ?? -Infinity, offer.price));
}

const products = new Map();
for (const [key, highestKitCost] of groups) {
  const [name, strength, region] = key.split("\u0000");
  if (!products.has(name)) products.set(name, { name, china: [], usa: [] });
  products.get(name)[region].push({
    strength,
    price: wholesaleKitPrice(highestKitCost),
    msrp: singleVialMsrp(highestKitCost),
    retail: retailTiers(highestKitCost),
  });
}

const catalog = [...products.values()]
  .map((product) => ({
    ...product,
    china: product.china.sort((a, b) => numericStrength(a.strength) - numericStrength(b.strength)),
    usa: product.usa.sort((a, b) => numericStrength(a.strength) - numericStrength(b.strength)),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated ${catalog.length} products from ${offers.length} TPLPrice offers.`);
