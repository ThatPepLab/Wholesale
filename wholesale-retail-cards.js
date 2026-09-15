(() => {
  const catalogGroups = document.querySelector("#catalog-groups");
  if (!catalogGroups) return;

  const vialImage = "https://thatpeplab.github.io/Retail/assets/retail-vial-template.webp";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));

  const displayProductName = (name) => {
    const value = String(name || "").trim();
    if (/^glp-?3rt$/i.test(value)) return "GLP-3RT";
    if (/^tirzepatide$/i.test(value)) return "GLP-2TR";
    if (/^semaglutide$/i.test(value)) return "Semaglutide (GLP-1)";
    return value;
  };

  function productCard(button) {
    const rawName = button.dataset.product || button.textContent.trim();
    const name = displayProductName(button.textContent.trim() || rawName);
    const longName = name.length > 18 ? " long-name" : "";
    return `<article class="catalog-product-card wholesale-product-card">
      <button type="button" class="catalog-card-main" data-product="${escapeHtml(rawName)}">
        <div class="catalog-vial">
          <img src="${vialImage}" alt="${escapeHtml(name)} research vial" loading="lazy" width="500" height="500">
          <span class="${longName.trim()}">${escapeHtml(name)}</span>
        </div>
        <div class="catalog-card-copy">
          <h4>${escapeHtml(name)}</h4>
          <p>Choose strength and wholesale package options.</p>
        </div>
      </button>
      <div class="catalog-card-status"><span class="catalog-wholesale-badge">WHOLESALE</span></div>
      <button type="button" class="catalog-view-options" data-product="${escapeHtml(rawName)}">View Options <span aria-hidden="true">›</span></button>
    </article>`;
  }

  function retailizeCatalog() {
    const groups = [...catalogGroups.querySelectorAll(".catalog-group")];
    for (const group of groups) {
      if (group.dataset.retailized === "1") continue;

      const summary = group.querySelector(":scope > summary");
      const products = group.querySelector(":scope > .product-buttons");
      if (!summary || !products) continue;

      const categoryName = summary.querySelector("span")?.textContent?.trim() || "Products";
      const countText = summary.querySelector("small")?.textContent?.trim() || "View available products";
      summary.innerHTML = `<span class="category-icon" aria-hidden="true">◇</span><span class="category-copy"><strong>${escapeHtml(categoryName)}</strong><small>${escapeHtml(countText)}</small></span><span class="category-action">View products <b aria-hidden="true">+</b></span>`;

      const originalButtons = [...products.querySelectorAll(":scope > button[data-product]")];
      if (originalButtons.length) products.innerHTML = originalButtons.map(productCard).join("");

      group.dataset.retailized = "1";
    }
  }

  let scheduled = false;
  const scheduleRetailize = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      retailizeCatalog();
    });
  };

  const observer = new MutationObserver(scheduleRetailize);
  observer.observe(catalogGroups, { childList: true, subtree: true });
  retailizeCatalog();
})();
