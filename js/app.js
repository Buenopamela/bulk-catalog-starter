// js/app.js

// ---- Safe DOM lookups ----
const catNav = document.getElementById("cat-nav");
const catalog = document.getElementById("catalog");

if (!catNav || !catalog) {
  console.warn("Missing #cat-nav or #catalog in HTML");
  throw new Error("Required containers not found");
}

// ---- State & caches ----
let ALL_CATS = [];
let ALL_PRODS = [];
const state = { cat: "all" }; // 'all' | categoryId | categorySlug

// ---- Render helpers ----
function renderNav(cats) {
  const pills = [{ slug: "all", name: "Todos" }, ...cats]
    .map((c) => {
      const active =
        (state.cat === "all" && c.slug === "all") ||
        String(state.cat) === String(c.id) ||
        state.cat === c.slug;
      return `<button class="btn ${active ? "is-active" : ""}" data-cat="${
        c.slug
      }" data-id="${c.id ?? ""}">${c.name}</button>`;
    })
    .join("");
  catNav.innerHTML = pills;
}
const BRAND_LOGOS = {
  "Punta de Agua": "assets/brands/punta-de-agua.svg",
  Tregar: "assets/brands/tregar.svg",
  Bimbo: "assets/brands/bimbo.svg",
};

function renderProducts(list) {
  const filtered =
    state.cat === "all"
      ? list
      : list.filter(
          (p) =>
            String(p.categoryId) === String(state.cat) ||
            p.category === state.cat
        );

  catalog.innerHTML = filtered
    .map(
      (p) => `
    <article class="card">
      <img src="${p.image}" alt="${p.name}"
           onerror="this.style.visibility='hidden'">
      <h4>${p.name}</h4>
      <p class="meta">
  ${
    BRAND_LOGOS[p.brand]
      ? `<img class="brand" src="${BRAND_LOGOS[p.brand]}" alt="${
          p.brand
        }" loading="lazy">`
      : ""
  }
  ${p.brand}
</p>

      <div class="actions">
        <a class="btn primary" href="${waUrl(
          p
        )}" target="_blank" rel="noopener">Consultar</a>
      </div>
    </article>
  `
    )
    .join("");
}

// ---- WhatsApp CTA ----
const WHATSAPP = { phone: "5491163581814" }; // <- put your number here
function waUrl(p) {
  const text = encodeURIComponent(
    `Hola! Quiero cotizar *${p.name}* (${p.brand}).`
  );
  return `https://wa.me/${WHATSAPP.phone}?text=${text}`;
}

// ---- Events ----
catNav.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cat]");
  if (!btn) return;
  const slug = btn.dataset.cat;
  const id = btn.dataset.id;

  state.cat = slug === "all" ? "all" : id || slug;

  // active pill
  [...catNav.querySelectorAll(".btn")].forEach((b) =>
    b.classList.toggle("is-active", b === btn)
  );
  renderProducts(ALL_PRODS);
  // scroll to products on mobile
  catalog.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---- Boot ----
(async () => {
  ALL_CATS = await window.DataAPI.categories();
  ALL_PRODS = await window.DataAPI.products();
  renderNav(ALL_CATS);
  renderProducts(ALL_PRODS);
})();
