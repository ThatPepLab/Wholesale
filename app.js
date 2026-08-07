const state = { products: [], selectedProduct: null, selectedStrength: "" };
const search = document.querySelector("#search");
const suggestions = document.querySelector("#suggestions");
const selection = document.querySelector("#selection");
const selectedName = document.querySelector("#selected-name");
const strengthSelect = document.querySelector("#strength");
const prices = document.querySelector("#prices");
const prompt = document.querySelector("#prompt");
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
  return `<article class="kit-card" tabindex="0" role="button" aria-expanded="false" aria-label="${label} pricing. Hover, focus, or tap for MSRP tiers."><div class="region-label"><span class="source-dot ${label === "U.S." ? "usa" : "china"}" aria-hidden="true"></span>${label}</div><p class="kit-label">10 Vial Kit</p><p class="kit-price">${money.format(item.price)}</p><p class="kit-strength">${escapeHtml(item.strength)} per vial</p><p class="kit-msrp">MSRP per single vial: <strong>${money.format(item.msrp)}</strong></p><p class="tier-hint">Hover or tap for MSRP tiers</p><div class="tier-panel"><p class="tier-title">Customer MSRP</p><div class="tier-row"><span>1 vial</span><strong>${money.format(item.retail.one)}</strong><small>Regular price</small></div><div class="tier-row"><span>3 vials</span><strong>${money.format(item.retail.three)}</strong><small>10% off</small></div><div class="tier-row"><span>5 vials</span><strong>${money.format(item.retail.five)}</strong><small>15% off</small></div><div class="tier-row"><span>10 vials</span><strong>${money.format(item.retail.ten)}</strong><small>20% off</small></div></div></article>`;
}
function renderPrice() {
  if (!state.selectedProduct || !state.selectedStrength) return;
  const china = state.selectedProduct.china.find((item) => item.strength === state.selectedStrength);
  const usa = state.selectedProduct.usa.find((item) => item.strength === state.selectedStrength);
  prices.innerHTML = `${regionPrice("China", china)}${regionPrice("U.S.", usa)}`;
}
search.addEventListener("input", () => { state.selectedProduct = null; selection.hidden = true; prompt.hidden = false; renderSuggestions(); });
search.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); const first = matchingProducts()[0]; if (first) chooseProduct(first.name); } });
suggestions.addEventListener("click", (event) => { const button = event.target.closest("[data-product]"); if (button) chooseProduct(button.dataset.product); });
strengthSelect.addEventListener("change", () => { state.selectedStrength = strengthSelect.value; renderPrice(); });
prices.addEventListener("click", (event) => {
  const card = event.target.closest(".kit-card");
  if (!card) return;
  const expanded = !card.classList.contains("expanded");
  prices.querySelectorAll(".kit-card").forEach((item) => { item.classList.remove("expanded"); item.setAttribute("aria-expanded", "false"); });
  card.classList.toggle("expanded", expanded);
  card.setAttribute("aria-expanded", String(expanded));
});
prices.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("kit-card")) {
    event.preventDefault();
    event.target.click();
  }
});
fetch("catalog-data.json?v=20260807-4").then((response) => { if (!response.ok) throw new Error("Catalog data could not be loaded."); return response.json(); }).then((products) => { state.products = products; }).catch(() => { prompt.innerHTML = "<strong>Catalog unavailable.</strong><span>Please refresh the page.</span>"; });
