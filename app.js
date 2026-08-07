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

const state = { products: [], selectedProduct: null, selectedStrength: "", carts: { china: [], usa: [] } };
const search = document.querySelector("#search");
const suggestions = document.querySelector("#suggestions");
const selection = document.querySelector("#selection");
const selectedName = document.querySelector("#selected-name");
const strengthSelect = document.querySelector("#strength");
const prices = document.querySelector("#prices");
const prompt = document.querySelector("#prompt");
const cartCount = document.querySelector("#cart-count");
const cartContainers = { china: document.querySelector("#china-cart"), usa: document.querySelector("#usa-cart") };
const cartTotals = { china: document.querySelector("#china-totals"), usa: document.querySelector("#usa-totals") };
const orderForm = document.querySelector("#order-form");
const grandTotal = document.querySelector("#grand-total");
const submitOrder = document.querySelector("#submit-order");
const formStatus = document.querySelector("#form-status");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const strengthNumber = (value) => Number.parseFloat(value) || 0;

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
function chooseProduct(name) {
  const product = state.products.find((item) => item.name === name);
  if (!product) return;
  state.selectedProduct = product;
  search.value = product.name;
  suggestions.hidden = true;
  selectedName.textContent = product.name;
  const strengths = [...new Set([...product.china, ...product.usa].map((item) => item.strength))].sort((a, b) => strengthNumber(a) - strengthNumber(b));
  strengthSelect.innerHTML = strengths.map((strength) => `<option value="${escapeHtml(strength)}">${escapeHtml(strength)}</option>`).join("");
  state.selectedStrength = strengths[0] || "";
  strengthSelect.value = state.selectedStrength;
  selection.hidden = false;
  prompt.hidden = true;
  renderPrice();
}
function regionPrice(label, item) {
  if (!item) return "";
  const region = label === "U.S." ? "usa" : "china";
  return `<article class="kit-card" tabindex="0" role="button" aria-expanded="false" aria-label="${label} pricing. Hover, focus, or tap for MSRP tiers."><div class="region-label"><span class="source-dot ${region === "usa" ? "usa" : "china"}" aria-hidden="true"></span>${label}</div><p class="kit-label">10 Vial Kit</p><p class="kit-price">${money.format(item.price)}</p><p class="kit-strength">${escapeHtml(item.strength)} per vial</p><p class="kit-msrp">MSRP per single vial: <strong>${money.format(item.msrp)}</strong></p><button class="add-cart-button" type="button" data-add-region="${region}">Add 10 Vial Kit to ${label} Cart</button><p class="tier-hint">Hover or tap for MSRP tiers</p><div class="tier-panel"><p class="tier-title">Customer MSRP</p><div class="tier-row"><span>1 vial</span><strong>${money.format(item.retail.one)}</strong><small>Regular price</small></div><div class="tier-row"><span>3 vials</span><strong>${money.format(item.retail.three)}</strong><small>10% off</small></div><div class="tier-row"><span>5 vials</span><strong>${money.format(item.retail.five)}</strong><small>15% off</small></div><div class="tier-row"><span>10 vials</span><strong>${money.format(item.retail.ten)}</strong><small>20% off</small></div></div></article>`;
}
function renderPrice() {
  if (!state.selectedProduct || !state.selectedStrength) return;
  const china = state.selectedProduct.china.find((item) => item.strength === state.selectedStrength);
  const usa = state.selectedProduct.usa.find((item) => item.strength === state.selectedStrength);
  prices.innerHTML = `${regionPrice("China", china)}${regionPrice("U.S.", usa)}`;
}
function cartSubtotal(region) { return state.carts[region].reduce((sum, item) => sum + (item.price * item.quantity), 0); }
function regionTotal(region) { return state.carts[region].length ? cartSubtotal(region) + 40 : 0; }
function orderSummary(region) {
  if (!state.carts[region].length) return "No items";
  const lines = state.carts[region].map((item) => `${item.quantity} x ${item.name} — ${item.strength} — 10 vial kit @ ${money.format(item.price)} = ${money.format(item.quantity * item.price)}`);
  return `${lines.join("\n")}\nSubtotal: ${money.format(cartSubtotal(region))}\nShipping: $40\n${region === "usa" ? "U.S." : "China"} total: ${money.format(regionTotal(region))}`;
}
function renderCart() {
  ["china", "usa"].forEach((region) => {
    const items = state.carts[region];
    cartContainers[region].innerHTML = items.length ? items.map((item) => `<div class="cart-line"><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.strength)} · 10 vial kit · ${money.format(item.price)}</span></div><div class="quantity-control" aria-label="Quantity for ${escapeHtml(item.name)} ${escapeHtml(item.strength)}"><button type="button" data-cart-action="decrease" data-region="${region}" data-key="${escapeHtml(item.key)}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-cart-action="increase" data-region="${region}" data-key="${escapeHtml(item.key)}" aria-label="Increase quantity">+</button><button type="button" class="remove-item" data-cart-action="remove" data-region="${region}" data-key="${escapeHtml(item.key)}" aria-label="Remove item">Remove</button></div><strong>${money.format(item.price * item.quantity)}</strong></div>`).join("") : `<p class="empty-cart">No ${region === "usa" ? "U.S." : "China"} kits added.</p>`;
    cartTotals[region].hidden = !items.length;
    cartTotals[region].innerHTML = items.length ? `<div><span>Subtotal</span><strong>${money.format(cartSubtotal(region))}</strong></div><div><span>Shipping</span><strong>$40</strong></div><div class="regional-total"><span>${region === "usa" ? "U.S." : "China"} total</span><strong>${money.format(regionTotal(region))}</strong></div>` : "";
  });
  const kitCount = [...state.carts.china, ...state.carts.usa].reduce((sum, item) => sum + item.quantity, 0);
  const total = regionTotal("china") + regionTotal("usa");
  cartCount.textContent = `${kitCount} ${kitCount === 1 ? "kit" : "kits"}`;
  grandTotal.textContent = money.format(total);
  submitOrder.disabled = kitCount === 0;
  document.querySelector("#china-order-field").value = orderSummary("china");
  document.querySelector("#usa-order-field").value = orderSummary("usa");
  document.querySelector("#order-total-field").value = money.format(total);
}
function addToCart(region) {
  if (!state.selectedProduct || !state.selectedStrength) return;
  const item = state.selectedProduct[region].find((entry) => entry.strength === state.selectedStrength);
  if (!item) return;
  const key = `${state.selectedProduct.name}|${item.strength}`;
  const existing = state.carts[region].find((entry) => entry.key === key);
  if (existing) existing.quantity += 1;
  else state.carts[region].push({ key, name: state.selectedProduct.name, strength: item.strength, price: item.price, quantity: 1 });
  renderCart();
  formStatus.textContent = `${state.selectedProduct.name} ${item.strength} added to the ${region === "usa" ? "U.S." : "China"} cart.`;
}
search.addEventListener("input", () => { state.selectedProduct = null; selection.hidden = true; prompt.hidden = false; renderSuggestions(); });
search.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); const first = matchingProducts()[0]; if (first) chooseProduct(first.name); } });
suggestions.addEventListener("click", (event) => { const button = event.target.closest("[data-product]"); if (button) chooseProduct(button.dataset.product); });
strengthSelect.addEventListener("change", () => { state.selectedStrength = strengthSelect.value; renderPrice(); });
prices.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-region]");
  if (addButton) { event.stopPropagation(); addToCart(addButton.dataset.addRegion); return; }
  const card = event.target.closest(".kit-card");
  if (!card) return;
  const expanded = !card.classList.contains("expanded");
  prices.querySelectorAll(".kit-card").forEach((item) => { item.classList.remove("expanded"); item.setAttribute("aria-expanded", "false"); });
  card.classList.toggle("expanded", expanded);
  card.setAttribute("aria-expanded", String(expanded));
});
document.querySelector(".cart-section").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  const items = state.carts[button.dataset.region];
  const item = items.find((entry) => entry.key === button.dataset.key);
  if (!item) return;
  if (button.dataset.cartAction === "increase") item.quantity += 1;
  if (button.dataset.cartAction === "decrease") item.quantity -= 1;
  if (button.dataset.cartAction === "remove" || item.quantity <= 0) state.carts[button.dataset.region] = items.filter((entry) => entry.key !== item.key);
  renderCart();
});
orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.carts.china.length && !state.carts.usa.length) return;
  submitOrder.disabled = true;
  submitOrder.textContent = "Sending…";
  formStatus.textContent = "Submitting your order request…";
  try {
    const response = await fetch(orderForm.action, { method: "POST", body: new FormData(orderForm), headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Submission failed");
    state.carts = { china: [], usa: [] };
    orderForm.reset();
    renderCart();
    formStatus.textContent = "Order request sent. We will contact you to confirm availability and payment.";
  } catch (error) {
    formStatus.textContent = "The order request could not be sent. Please check your information and try again.";
  } finally {
    submitOrder.textContent = "Submit Order Request";
    submitOrder.disabled = !state.carts.china.length && !state.carts.usa.length;
  }
});
prices.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("kit-card")) {
    event.preventDefault();
    event.target.click();
  }
});
fetch(`catalog-data.json?updated=${Date.now()}`, { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Catalog data could not be loaded."); return response.json(); }).then((products) => { state.products = products; }).catch(() => { prompt.innerHTML = "<strong>Catalog unavailable.</strong><span>Please refresh the page.</span>"; });
renderCart();
