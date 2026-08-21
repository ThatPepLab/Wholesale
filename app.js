const accessGate = document.querySelector("#access-gate");
const accessForm = document.querySelector("#access-form");
const accessPassword = document.querySelector("#access-password");
const accessError = document.querySelector("#access-error");
const accessButton = document.querySelector("#access-button");
const accessHash = "02876ccb394ad5f47bf360a980a3f76483a2da4b44521cbc10ba4a3f6c8cba61";
async function accessDigest(value) { const bytes = new TextEncoder().encode(value); const hash = await crypto.subtle.digest("SHA-256", bytes); return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function unlockSite() { document.body.classList.remove("site-locked"); accessGate.hidden = true; accessPassword.value = ""; }
if (sessionStorage.getItem("tplWholesaleAccess") === "granted") unlockSite();
accessForm.addEventListener("submit", async (event) => { event.preventDefault(); accessError.textContent = ""; accessButton.disabled = true; if (await accessDigest(accessPassword.value) === accessHash) { sessionStorage.setItem("tplWholesaleAccess", "granted"); unlockSite(); } else { accessError.textContent = "Incorrect password."; accessPassword.select(); } accessButton.disabled = false; });

const state = { products: [], selectedProduct: null, selectedStrength: "", cart: [], inventory: new Map(), incoming: new Map() };
const search = document.querySelector("#search");
const suggestions = document.querySelector("#suggestions");
const categorySelect = document.querySelector("#category");
const catalogGroups = document.querySelector("#catalog-groups");
const selection = document.querySelector("#selection");
const selectedName = document.querySelector("#selected-name");
const strengthSelect = document.querySelector("#strength");
const prices = document.querySelector("#prices");
const prompt = document.querySelector("#prompt");
const inStockSection = document.querySelector("#in-stock-section");
const inStockGroups = document.querySelector("#in-stock-groups");
const inStockCount = document.querySelector("#in-stock-count");
const comingSoonSection = document.querySelector("#coming-soon-section");
const comingSoonGroups = document.querySelector("#coming-soon-groups");
const comingSoonCount = document.querySelector("#coming-soon-count");
const cartCount = document.querySelector("#cart-count");
const cartContainer = document.querySelector("#cart-lines");
const cartTotals = document.querySelector("#cart-totals");
const orderForm = document.querySelector("#order-form");
const grandTotal = document.querySelector("#grand-total");
const submitOrder = document.querySelector("#submit-order");
const downloadCartPdf = document.querySelector("#download-cart-pdf");
const formStatus = document.querySelector("#form-status");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const PDF_QR = { supplies: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAM0AAADNAQAAAAAzx8nEAAAB+0lEQVR42u1YMW7kMBDjrBaQO/kH8kdi7bcCOLGSzb9i331E+sG4kwHbvGIv16W1isuUnoYgKQ5oIb6Z9YJv52f1n6wWEbksMYPtR5bQ7iIi8XyEIzm5K1aTo7dzjp7UCkTt0gDPnfv0L91yASCXanp9eEjm7A4XK9pmYVpesYcltLXca1iAN7HvMKn5rQCPGjDeRG4YfAPsnZ2WmEXak2GAf+dOe7jNF/n6UCqwIe3erSbbZCcgN1hq5EayVDODfpWG7f54tWeLogMg3MADg7ezGtq5higAd7n61aiZ15uLWG9niwJSR9pZRyLo4EtQQ4Sz2QDJOxHIZGeS6F30pcd4PozNF+HmS+/uqQRGbw9XgQ3SkveEwA0IChSpIIoaFtEBJO+Jk7snSz1fFB18CWQqcEz2cBFFasAYUxE1qQjv5EwmO7kqudE8+ZfOHkBu+iVivVVJUW8njLSTY4KoYeldDYsmewBA4OZ5uOhZyaIABlgqPEQNgSreyKTCA25D6d0GSI5VLiwcE3oMnhOAWin6MMjkIkrQkXY6+6Z8tTYA6yvgwXbvAFfl0HNWwM46pgKMRJWbMsDOavi4tUEBBB1rpCiAIa9BIppfMKxY9vfOTu6aS+9WKad7419rAyB5e7Dh3mu1Nnf16w0APyXm8nR2a5OfX3A/q2/mD0d+fuO8hiSrAAAAAElFTkSuQmCC", reorder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAM0AAADNAQAAAAAzx8nEAAACFklEQVR42u1YMY7kIBCsNpYgY37AfGTt3Wet5JU98kqb3Isusv0S/APIsGS7LvDoLtoUgttOQHRSQFFdjRDfxFbh2/hJ/SepKCIVDtlEhtXwdoiIDPkR9uQUR48Gny4tgCNDgYM6xACfDgveBRIAqXJfSv0c7QB9VgAQfxXgRv1van6Hm0MTS7FXMQHHfXu1+7XIswSMh8hr3KGnOMAswCpyywwDfMaO1EB5Tva5kHLDGJCEg9MMcKkNPTnZ/DBCT31CeT0HALA7koQ+L4wKwCew2K0F3e44QXnTlKDo+x3tWiMham/atUZiGYom4XgRUzMojzY3RSsgyt00cV/NEmsA6MBHidMYqWfSa3KAnkMHzgUebMBTMkgyNYBLUko3QgfN0BMAHKQEN+jNy+3Lb6/2yQ285LY9IDk4wI7UDJ3jzAE6u4pW1/abuEla8DWDN0U0Mb8JjKPXYwAM7NZC1n3dFPNfyqVXoyeDoj7t7sgCNcXuLi1xd1IBK5ZYrya7mF+2x7y4euVkP1pIUD6+hfwqGjpAgvJJuINzAPRZwG+QJIPy+kQHNOiJxpYobSKV/bhvb9Q+Acf9MkD53Rfn0FOfdgdP9Cwi5jjEwNaIVRwcFjxET6W67Pgh+oSaIaSPbe6a8rdrU7s0ONq1nY57aqdSXVu36jEA+iHaG+SuKZftgXBwerKjT429zFheisrPF9xP6pv4A9r2b7AcxltOAAAAAElFTkSuQmCC" };
const PDF_QR_URLS = { supplies: "https://thatpeplab.github.io/Supplies/", reorder: "https://thatpeplab.github.io/Wholesale/" };
const pdfText = (value) => String(value ?? "").replace(/[–—]/g, "-").replace(/×/g, "x").replace(/[^\x20-\x7E]/g, "");
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const strengthNumber = (value) => Number.parseFloat(value) || 0;

const categories = [
  { name: "Weight Loss", test: /semaglutide|tirzepatide|trizepatide|glp-?3rt|cagrilintide|cagilintide|mazdutide|survodutide|eloralintide|adipotide|aod-?9604|hgh fragment|lemon bottle|lipo lab|lipo-[bc]|lipo-c|fat blaster|5-amino/i },
  { name: "Energy & Metabolic", test: /mots|ss-?31|nad\+|aicar|slu-?pp|l-carnitine|lc120|lc216|mic\b|superhuman|humanin|vitamin b12/i },
  { name: "Recovery & Repair", test: /bpc|tb500|tb-?500|glow|klow|kpv|ll-?37|ara-?290|cartalax|bronchogen|cardiogen|vesugen|lysine-proline-valine/i },
  { name: "Growth & Performance", test: /hgh|cjc|ghrp|ipamorelin|tesamorelin|sermorelin|igf|mgf|follistatin|ace-?031|gdf-?8|mk677|epo\b/i },
  { name: "Cognitive & Mood", test: /semax|selank|dihexa|dsip|pe-?22|pinealon|cerebrolysin|cortagen|adamax|melatonin|relaxation/i },
  { name: "Sexual & Hormone", test: /pt-?141|oxytocin|hcg\b|hmg\b|kisspeptin|gonadorelin|alprostadil|testagen|testosterone/i },
  { name: "Skin, Hair & Beauty", test: /melanotan|snap-?8|matrixyl|ahk-?cu|ghk-?cu|healthy hair|botulinum|hyaluronic/i },
  { name: "Immune & Wellness", test: /thym|epithalon|glutathione|foxo|pnc|vilon|crystagen|vip\b|vasoactive|dermorphin/i },
  { name: "Supplies", test: /water|saline|phosphate buffered|acetic acid/i }
];
const categoryFor = (name) => categories.find((category) => category.test.test(name))?.name || "Other";
const stockKey = (product, strength) => `${String(product).trim().toLowerCase()}|${String(strength).trim().toLowerCase()}`;
const stockQuantity = (product, strength) => state.inventory.get(stockKey(product, strength)) || 0;
const incomingInventory = (product, strength) => state.incoming.get(stockKey(product, strength)) || null;
const productStrengths = (product) => product.items.map((item) => item.strength).sort((a, b) => strengthNumber(a) - strengthNumber(b));

function renderInStockSection() {
  const groups = new Map();
  const items = [];
  for (const product of state.products) {
    for (const strength of productStrengths(product)) {
      const quantity = stockQuantity(product.name, strength);
      const kits = Math.floor(quantity / 10);
      if (kits > 0) items.push({ product, category: categoryFor(product.name), strength, quantity, kits });
    }
  }
  inStockSection.hidden = items.length === 0;
  if (!items.length) { inStockGroups.innerHTML = ""; inStockCount.textContent = ""; return; }
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  const ordered = [...categories.map((item) => item.name), "Other"];
  inStockCount.textContent = `${items.length} available strength${items.length === 1 ? "" : "s"}`;
  inStockGroups.innerHTML = ordered.filter((name) => groups.has(name)).map((name) => `<section class="in-stock-category"><h3>${escapeHtml(name)}</h3><div class="in-stock-items">${groups.get(name).sort((a, b) => a.product.name.localeCompare(b.product.name) || strengthNumber(a.strength) - strengthNumber(b.strength)).map((item) => `<button type="button" data-stock-product="${escapeHtml(item.product.name)}" data-stock-strength="${escapeHtml(item.strength)}"><span><strong>${escapeHtml(item.product.name)}</strong><small>${escapeHtml(item.strength)} per vial</small></span><b>${item.kits} kit${item.kits === 1 ? "" : "s"} available</b></button>`).join("")}</div></section>`).join("");
}

function formatArrival(value) {
  if (!value) return "Arrival date pending";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : `Expected ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)}`;
}

function renderComingSoonSection() {
  if (!comingSoonSection || !comingSoonGroups || !comingSoonCount) return;
  const groups = new Map();
  const items = [];
  for (const product of state.products) {
    for (const strength of productStrengths(product)) {
      const incoming = incomingInventory(product.name, strength);
      if (!incoming) continue;
      const kits = Math.floor(incoming.incomingQuantity / 10);
      items.push({ product, category: categoryFor(product.name), strength, kits, ...incoming });
    }
  }
  comingSoonSection.hidden = items.length === 0;
  if (!items.length) { comingSoonGroups.innerHTML = ""; comingSoonCount.textContent = ""; return; }
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  const ordered = [...categories.map((item) => item.name), "Other"];
  comingSoonCount.textContent = `${items.length} incoming strength${items.length === 1 ? "" : "s"}`;
  comingSoonGroups.innerHTML = ordered.filter((name) => groups.has(name)).map((name) => `<section class="coming-soon-category"><h3>${escapeHtml(name)}</h3><div class="coming-soon-items">${groups.get(name).sort((a, b) => a.product.name.localeCompare(b.product.name) || strengthNumber(a.strength) - strengthNumber(b.strength)).map((item) => `<button type="button" data-stock-product="${escapeHtml(item.product.name)}" data-stock-strength="${escapeHtml(item.strength)}"><span><strong>${escapeHtml(item.product.name)}</strong><small>${escapeHtml(item.strength)} per vial</small></span><b>${item.kits > 0 ? `${item.kits} kit${item.kits === 1 ? "" : "s"} coming` : "More on the way"}<small>${escapeHtml(formatArrival(item.expectedArrival))}</small></b></button>`).join("")}</div></section>`).join("");
}
async function fetchInventoryEntries() {
  const stamp = Date.now();
  const sources = [
    `https://raw.githubusercontent.com/ThatPepLab/InStock/main/inventory.json?updated=${stamp}`,
    `inventory.json?updated=${stamp}`
  ];
  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (response.ok) return await response.json();
    } catch (error) {
      console.warn("Inventory source failed", source, error);
    }
  }
  throw new Error("Inventory unavailable");
}
async function refreshInventory() {
  try {
    const entries = await fetchInventoryEntries();
    const next = new Map();
    const incoming = new Map();
    for (const entry of Array.isArray(entries) ? entries : []) {
      if (!entry.product || !entry.strength) continue;
      const key = stockKey(entry.product, entry.strength);
      const quantity = Math.max(0, Math.floor(Number(entry.quantity) || 0));
      if (quantity > 0) next.set(key, quantity);
      if (entry.moreOnWay === true) incoming.set(key, {
        incomingQuantity: Math.max(0, Math.floor(Number(entry.incomingQuantity) || 0)),
        expectedArrival: String(entry.expectedArrival || "").trim()
      });
    }
    state.inventory = next;
    state.incoming = incoming;
    renderInStockSection();
    renderComingSoonSection();
    if (state.selectedProduct) renderPrice();
  } catch (error) {
    console.warn("Inventory check failed", error);
  }
}

function matchingProducts() {
  const query = search.value.trim().toLowerCase();
  if (!query) return [];
  return state.products.filter((product) => product.name.toLowerCase().includes(query)).slice(0, 12);
}
function renderSuggestions() {
  const matches = matchingProducts();
  suggestions.hidden = matches.length === 0;
  suggestions.innerHTML = matches.map((product) => `<button type="button" data-product="${escapeHtml(product.name)}">${escapeHtml(product.name)}</button>`).join("");
}
function renderCatalog() {
  const selected = categorySelect.value;
  const expanded = new Set([...catalogGroups.querySelectorAll(".catalog-group[open] summary span:first-child")].map((node) => node.textContent));
  const groups = new Map();
  for (const product of state.products) {
    const category = categoryFor(product.name);
    if (selected !== "all" && category !== selected) continue;
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(product);
  }
  const ordered = [...categories.map((item) => item.name), "Other"];
  catalogGroups.innerHTML = ordered.filter((name) => groups.has(name)).map((name) => {
    const products = groups.get(name).sort((a, b) => a.name.localeCompare(b.name));
    const open = selected !== "all" || expanded.has(name) ? " open" : "";
    return `<details class="catalog-group"${open}><summary><span>${escapeHtml(name)}</span><small>${products.length} product${products.length === 1 ? "" : "s"}</small></summary><div class="product-buttons">${products.map((product) => `<button type="button" data-product="${escapeHtml(product.name)}">${escapeHtml(product.name)}</button>`).join("")}</div></details>`;
  }).join("");
}
function chooseProduct(name) {
  const product = state.products.find((item) => item.name === name);
  if (!product) return;
  state.selectedProduct = product;
  search.value = product.name;
  suggestions.hidden = true;
  selectedName.textContent = product.name;
  const strengths = productStrengths(product);
  strengthSelect.innerHTML = strengths.map((strength) => `<option value="${escapeHtml(strength)}">${escapeHtml(strength)}</option>`).join("");
  state.selectedStrength = strengths[0] || "";
  strengthSelect.value = state.selectedStrength;
  selection.hidden = false;
  prompt.hidden = true;
  renderPrice();
  selection.scrollIntoView({ behavior: "smooth", block: "start" });
}
function kitCard(item, localKits) {
  if (!item) return "";
  const usAvailable = item.usAvailable || localKits > 0;
  const coa = window.COARegistry?.markup(state.selectedProduct?.name, item.strength) || "";
  return `<article class="kit-card single-kit-card">${usAvailable ? `<div class="us-available-strip">US Available${localKits > 0 ? ` · ${localKits} local kit${localKits === 1 ? "" : "s"}` : ""}</div>` : ""}<div class="kit-card-body"><p class="kit-label">10 Vial Kit</p><p class="kit-price">${money.format(item.price)}</p><p class="kit-strength">${escapeHtml(item.strength)} per vial</p>${coa}<button class="add-cart-button" type="button" data-add-kit>Add 10 Vial Kit to Cart</button></div></article>`;
}
function renderPrice() {
  if (!state.selectedProduct || !state.selectedStrength) return;
  const item = state.selectedProduct.items.find((entry) => entry.strength === state.selectedStrength);
  const completeKits = Math.floor(stockQuantity(state.selectedProduct.name, state.selectedStrength) / 10);
  prices.innerHTML = kitCard(item, completeKits);
}
function cartSubtotal() { return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); }
function orderTotal() { return state.cart.length ? cartSubtotal() + 20 : 0; }
function orderSummary() {
  if (!state.cart.length) return "No items";
  const lines = state.cart.map((item) => `${item.quantity} x ${item.name} — ${item.strength} — 10 vial kit @ ${money.format(item.price)} = ${money.format(item.quantity * item.price)}${item.usAvailable ? " — US Available" : ""}`);
  return `${lines.join("\n")}\nSubtotal: ${money.format(cartSubtotal())}\nShipping: $20\nOrder total: ${money.format(orderTotal())}`;
}
function renderCart() {
  cartContainer.innerHTML = state.cart.length ? state.cart.map((item) => `<div class="cart-line"><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.strength)} · 10 vial kit · ${money.format(item.price)}${item.usAvailable ? " · US Available" : ""}</span></div><div class="quantity-control" aria-label="Quantity for ${escapeHtml(item.name)} ${escapeHtml(item.strength)}"><button type="button" data-cart-action="decrease" data-key="${escapeHtml(item.key)}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-cart-action="increase" data-key="${escapeHtml(item.key)}" aria-label="Increase quantity">+</button><button type="button" class="remove-item" data-cart-action="remove" data-key="${escapeHtml(item.key)}" aria-label="Remove item">Remove</button></div><strong>${money.format(item.price * item.quantity)}</strong></div>`).join("") : `<p class="empty-cart">No kits added.</p>`;
  cartTotals.hidden = !state.cart.length;
  cartTotals.innerHTML = state.cart.length ? `<div><span>Subtotal</span><strong>${money.format(cartSubtotal())}</strong></div><div><span>Shipping</span><strong>$20</strong></div><div class="regional-total"><span>Order total</span><strong>${money.format(orderTotal())}</strong></div>` : "";
  const kitCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = orderTotal();
  cartCount.textContent = `${kitCount} ${kitCount === 1 ? "kit" : "kits"}`;
  grandTotal.textContent = money.format(total);
  submitOrder.disabled = kitCount === 0;
  downloadCartPdf.disabled = kitCount === 0;
  document.querySelector("#order-summary-field").value = orderSummary();
  document.querySelector("#order-total-field").value = money.format(total);
}
function downloadCartPdfFile() {
  if (!state.cart.length) return;
  if (!window.jspdf?.jsPDF) { formStatus.textContent = "The PDF tool is unavailable. Please refresh and try again."; return; }
  const doc = new window.jspdf.jsPDF({ unit: "pt", format: "letter" });
  const margin = 42, pageWidth = doc.internal.pageSize.getWidth(), pageHeight = doc.internal.pageSize.getHeight(), contentWidth = pageWidth - margin * 2;
  const navy = [1, 30, 65], orange = [230, 83, 0], muted = [93, 107, 122], line = [216, 222, 232];
  let y = 44;
  const addPageIfNeeded = (height) => { if (y + height > pageHeight - 48) { doc.addPage(); y = 44; } };
  const writeLine = (label, value, bold = false) => { addPageIfNeeded(22); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(10); doc.setTextColor(...navy); doc.text(pdfText(label), margin, y); doc.text(pdfText(value), pageWidth - margin, y, { align: "right" }); y += 18; };
  doc.setFillColor(...navy); doc.roundedRect(margin, y, contentWidth, 60, 10, 10, "F");
  doc.setFillColor(...orange); doc.rect(margin, y, 7, 60, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.text("Wholesale Cart", margin + 20, y + 38);
  y += 84; doc.setTextColor(...muted); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(`Created ${new Date().toLocaleString()}`, margin, y); y += 24;
  state.cart.forEach((item) => {
    addPageIfNeeded(55); doc.setDrawColor(...line); doc.line(margin, y, pageWidth - margin, y); y += 16;
    doc.setTextColor(...navy); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(pdfText(item.name), margin, y); doc.text(money.format(item.price * item.quantity), pageWidth - margin, y, { align: "right" }); y += 15;
    doc.setTextColor(...muted); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(pdfText(`${item.strength} | 10 vial kit | cart qty ${item.quantity}${item.usAvailable ? " | US Available" : ""}`), margin, y); y += 18;
  });
  addPageIfNeeded(96); doc.setDrawColor(...orange); doc.line(margin, y, pageWidth - margin, y); y += 22;
  writeLine("Subtotal", money.format(cartSubtotal())); writeLine("Shipping", "$20"); y += 4; writeLine("ORDER TOTAL", money.format(orderTotal()), true);
  const qrSize = 78, qrTop = pageHeight - margin - qrSize;
  if (y > qrTop - 42) { doc.addPage(); y = 44; }
  doc.setTextColor(...muted); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("Order request only. Payment is not collected on this website.", pageWidth / 2, qrTop - 30, { align: "center" });
  doc.setTextColor(...navy); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Supplies", margin + qrSize / 2, qrTop - 9, { align: "center" }); doc.text("ReOrder", pageWidth - margin - qrSize / 2, qrTop - 9, { align: "center" });
  doc.addImage(PDF_QR.supplies, "PNG", margin, qrTop, qrSize, qrSize); doc.addImage(PDF_QR.reorder, "PNG", pageWidth - margin - qrSize, qrTop, qrSize, qrSize);
  doc.link(margin, qrTop, qrSize, qrSize, { url: PDF_QR_URLS.supplies }); doc.link(pageWidth - margin - qrSize, qrTop, qrSize, qrSize, { url: PDF_QR_URLS.reorder });
  doc.save("Wholesale-Cart.pdf"); formStatus.textContent = "Cart PDF downloaded with Supplies and ReOrder QR codes.";
}

function addToCart() {
  if (!state.selectedProduct || !state.selectedStrength) return;
  const item = state.selectedProduct.items.find((entry) => entry.strength === state.selectedStrength);
  if (!item) return;
  const key = `${state.selectedProduct.name}|${item.strength}`;
  const existing = state.cart.find((entry) => entry.key === key);
  if (existing) existing.quantity += 1;
  else state.cart.push({ key, name: state.selectedProduct.name, strength: item.strength, price: item.price, usAvailable: item.usAvailable || stockQuantity(state.selectedProduct.name, item.strength) >= 10, quantity: 1 });
  renderCart();
  formStatus.textContent = `${state.selectedProduct.name} ${item.strength} added to the cart.`;
}
if (comingSoonGroups) comingSoonGroups.addEventListener("click", (event) => { const button = event.target.closest("[data-stock-product]"); if (!button) return; chooseProduct(button.dataset.stockProduct); if (state.selectedProduct && productStrengths(state.selectedProduct).includes(button.dataset.stockStrength)) { state.selectedStrength = button.dataset.stockStrength; strengthSelect.value = state.selectedStrength; renderPrice(); selection.scrollIntoView({ behavior: "smooth", block: "start" }); } });
inStockGroups.addEventListener("click", (event) => { const button = event.target.closest("[data-stock-product]"); if (!button) return; chooseProduct(button.dataset.stockProduct); if (state.selectedProduct && productStrengths(state.selectedProduct).includes(button.dataset.stockStrength)) { state.selectedStrength = button.dataset.stockStrength; strengthSelect.value = state.selectedStrength; renderPrice(); selection.scrollIntoView({ behavior: "smooth", block: "start" }); } });
search.addEventListener("input", () => { state.selectedProduct = null; selection.hidden = true; renderSuggestions(); });
search.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); const first = matchingProducts()[0]; if (first) chooseProduct(first.name); } });
document.addEventListener("click", (event) => { const button = event.target.closest?.("[data-product]"); if (!button) return; event.preventDefault(); chooseProduct(button.dataset.product); });
categorySelect.addEventListener("change", renderCatalog);
strengthSelect.addEventListener("change", () => { state.selectedStrength = strengthSelect.value; renderPrice(); });
prices.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-kit]");
  if (addButton) addToCart();
});
downloadCartPdf.addEventListener("click", downloadCartPdfFile);
document.querySelector(".cart-section").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  const item = state.cart.find((entry) => entry.key === button.dataset.key);
  if (!item) return;
  if (button.dataset.cartAction === "increase") item.quantity += 1;
  if (button.dataset.cartAction === "decrease") item.quantity -= 1;
  if (button.dataset.cartAction === "remove" || item.quantity <= 0) state.cart = state.cart.filter((entry) => entry.key !== item.key);
  renderCart();
});
orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.cart.length) return;
  submitOrder.disabled = true;
  submitOrder.textContent = "Sending…";
  formStatus.textContent = "Submitting your order request…";
  try {
    const response = await fetch(orderForm.action, { method: "POST", body: new FormData(orderForm), headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Submission failed");
    state.cart = [];
    orderForm.reset();
    renderCart();
    formStatus.textContent = "Order request sent. We will contact you to confirm availability and payment.";
  } catch (error) {
    formStatus.textContent = "The order request could not be sent. Please check your information and try again.";
  } finally {
    submitOrder.textContent = "Submit Order Request";
    submitOrder.disabled = !state.cart.length;
  }
});
fetch(`catalog-data.json?updated=${Date.now()}`, { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Catalog data could not be loaded."); return response.json(); }).then((products) => { state.products = products.filter((product) => !/^(?:Acetic Acid Solution|Water|phosphate buffered saline.*)$/i.test(product.name)).map((product) => { if (!/^BAC Water$/i.test(product.name)) return product; const tenMl = product.items.find((item) => /^10ml$/i.test(item.strength)) || product.items[0] || {}; return { ...product, items: [{ ...tenMl, strength: "10ml", price: 25, usAvailable: true }] }; }); const names = [...new Set(state.products.map((product) => categoryFor(product.name)))].sort(); categorySelect.insertAdjacentHTML("beforeend", names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")); renderInStockSection(); renderComingSoonSection(); renderCatalog(); }).catch(() => { prompt.hidden = false; prompt.innerHTML = "<strong>Catalog unavailable.</strong><span>Please refresh the page.</span>"; });
refreshInventory();
setInterval(refreshInventory, 300000);
renderCart();
document.addEventListener("coa-data-updated", () => { if (state.selectedProduct) renderPrice(); });
