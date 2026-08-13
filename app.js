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

const state = { products: [], selectedProduct: null, selectedStrength: "", cart: [], inventory: new Map() };
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
const cartCount = document.querySelector("#cart-count");
const cartContainer = document.querySelector("#cart-lines");
const cartTotals = document.querySelector("#cart-totals");
const orderForm = document.querySelector("#order-form");
const grandTotal = document.querySelector("#grand-total");
const submitOrder = document.querySelector("#submit-order");
const formStatus = document.querySelector("#form-status");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const strengthNumber = (value) => Number.parseFloat(value) || 0;

const categories = [
  { name: "Weight Loss", test: /semaglutide|tirzepatide|trizepatide|glp-?3rt|cagrilintide|cagilintide|mazdutide|survodutide|eloralintide|adipotide|aod-?9604|hgh fragment|lemon bottle|lipo lab|lipo-[bc]|lipo-c|fat blaster|5-amino/i },
  { name: "Energy & Metabolic", test: /mots|ss-?31|nad\+|aicar|slu-?pp|l-carnitine|lc120|lc216|mic\b|superhuman|humanin|vitamin b12/i },
  { name: "Recovery & Repair", test: /bpc|tb500|tb-?500|glow|klow|kpv|ll-?37|ara-?290|cartalax|bronchogen|cardiogen|vesugen|lysine-proline-valine/i },
  { name: "Growth & Performance", test: /hgh|cjc|ghrp|ipamorelin|tesamorelin|sermorelin|igf|mgf|follistatin|ace-?031|gdf-?8|mk677|epo\b/i },
  { name: "Cognitive & Mood", test: /semax|selank|dihexa|dsip|pe-?22|pinealon|cerebrolysin|cortagen|adamax|melatonin|relaxation/i },
  { name: "Sexual & Hormone", test: /pt-?141|oxytocin|hcg\b|hmg\b|kisspeptin|gonadorelin|alprostadil|testagen/i },
  { name: "Skin, Hair & Beauty", test: /melanotan|snap-?8|matrixyl|ahk-?cu|ghk-?cu|healthy hair|botulinum|hyaluronic/i },
  { name: "Immune & Wellness", test: /thym|epithalon|glutathione|foxo|pnc|vilon|crystagen|vip\b|vasoactive|dermorphin/i },
  { name: "Supplies", test: /water|saline|phosphate buffered|acetic acid/i }
];
const categoryFor = (name) => categories.find((category) => category.test.test(name))?.name || "Other";
const stockKey = (product, strength) => `${String(product).trim().toLowerCase()}|${String(strength).trim().toLowerCase()}`;
const stockQuantity = (product, strength) => state.inventory.get(stockKey(product, strength)) || 0;
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

async function refreshInventory() {
  try {
    const response = await fetch(`https://api.github.com/repos/ThatPepLab/InStock/contents/inventory.json?ref=main&updated=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error("Inventory unavailable");
    const payload = await response.json();
    const entries = JSON.parse(atob(String(payload.content || "").replace(/\s/g, "")));
    const next = new Map();
    for (const entry of Array.isArray(entries) ? entries : []) {
      const quantity = Math.max(0, Math.floor(Number(entry.quantity) || 0));
      if (entry.product && entry.strength && quantity > 0) next.set(stockKey(entry.product, entry.strength), quantity);
    }
    state.inventory = next;
    renderInStockSection();
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
  const groups = new Map();
  for (const product of state.products) {
    const category = categoryFor(product.name);
    if (selected !== "all" && category !== selected) continue;
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(product);
  }
  const ordered = [...categories.map((item) => item.name), "Other"];
  catalogGroups.innerHTML = ordered.filter((name) => groups.has(name)).map((name) => `<section class="catalog-group"><h2>${escapeHtml(name)}</h2><div class="product-buttons">${groups.get(name).sort((a, b) => a.name.localeCompare(b.name)).map((product) => `<button type="button" data-product="${escapeHtml(product.name)}">${escapeHtml(product.name)}</button>`).join("")}</div></section>`).join("");
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
  return `<article class="kit-card single-kit-card">${usAvailable ? `<div class="us-available-strip">US Available${localKits > 0 ? ` · ${localKits} local kit${localKits === 1 ? "" : "s"}` : ""}</div>` : ""}<div class="kit-card-body"><p class="kit-label">10 Vial Kit</p><p class="kit-price">${money.format(item.price)}</p><p class="kit-strength">${escapeHtml(item.strength)} per vial</p><button class="add-cart-button" type="button" data-add-kit>Add 10 Vial Kit to Cart</button></div></article>`;
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
  document.querySelector("#order-summary-field").value = orderSummary();
  document.querySelector("#order-total-field").value = money.format(total);
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
fetch(`catalog-data.json?updated=${Date.now()}`, { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Catalog data could not be loaded."); return response.json(); }).then((products) => { state.products = products; const names = [...new Set(products.map((product) => categoryFor(product.name)))].sort(); categorySelect.insertAdjacentHTML("beforeend", names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")); renderInStockSection(); renderCatalog(); }).catch(() => { prompt.hidden = false; prompt.innerHTML = "<strong>Catalog unavailable.</strong><span>Please refresh the page.</span>"; });
refreshInventory();
setInterval(refreshInventory, 300000);
renderCart();
