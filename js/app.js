// ---- Safe DOM lookups ----
const catNav = document.getElementById("cat-nav");
const catalog = document.getElementById("catalog");
const HAS_CATALOG = !!(catNav && catalog);

// ---- State ----
let ALL_CATS = [];
let ALL_PRODS = [];
const state = { cat: "all" };

// ---- Config ----
const WHATSAPP = { phone: "5491163581814" }; // set your number here

// Placeholder (only if neither product nor category has image)
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
      <rect width='100%' height='100%' fill='#111216'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            fill='#333' font-family='system-ui, -apple-system, Segoe UI, Roboto'
            font-size='28'>Imagen no disponible</text>
    </svg>`
  );

// ---- Helpers ----
function waUrl(p) {
  const text = encodeURIComponent(
    `Hola! Quiero cotizar *${p.name}* (${p.brand || ""}${
      p.unit ? ` — ${p.unit}` : ""
    }).`
  );
  return `https://wa.me/${WHATSAPP.phone}?text=${text}`;
}
function fmtPrice(n) {
  return typeof n === "number" ? `$${n.toLocaleString("es-AR")}` : "";
}

// ---- Category lookups ----
let CAT_BY_SLUG = {};
let CAT_BY_ID = {};
function buildCatIndexes(cats) {
  CAT_BY_SLUG = Object.fromEntries(cats.map((c) => [String(c.slug), c]));
  CAT_BY_ID = Object.fromEntries(cats.map((c) => [String(c.id), c]));
}

/* ---------- NAV: text-only pills ---------- */
function renderNav(cats) {
  if (!HAS_CATALOG) return;
  const list = [{ slug: "all", name: "Todos" }, ...cats]
    .map((c) => {
      const active =
        (state.cat === "all" && c.slug === "all") ||
        String(state.cat) === String(c.id) ||
        state.cat === c.slug;
      return `<button class="btn ${active ? "is-active" : ""}" data-cat="${
        c.slug
      }" data-id="${c.id ?? ""}">
        ${c.name}
      </button>`;
    })
    .join("");
  catNav.innerHTML = list;
}

/* ---------- Choose image: product → category → placeholder ---------- */
function imgForProduct(p) {
  if (p.image && p.image.trim()) return p.image;
  const cat =
    (p.category && CAT_BY_SLUG[String(p.category)]) ||
    (p.categoryId != null && CAT_BY_ID[String(p.categoryId)]);
  return (cat && cat.image) || PLACEHOLDER_IMG;
}

/* ---------- PRODUCTS (uses .media wrapper for clean sizing) ---------- */
function renderProducts(list) {
  if (!HAS_CATALOG) return;

  const filtered =
    state.cat === "all"
      ? list
      : list.filter(
          (p) =>
            String(p.categoryId) === String(state.cat) ||
            p.category === state.cat
        );

  catalog.innerHTML = filtered
    .map((p) => {
      const prodImg = imgForProduct(p);
      const catObj =
        (p.category && CAT_BY_SLUG[String(p.category)]) ||
        (p.categoryId != null && CAT_BY_ID[String(p.categoryId)]);
      const catImg = (catObj && catObj.image) || PLACEHOLDER_IMG;

      const unit = p.unit ? `<small class="meta">${p.unit}</small>` : "";
      const price = fmtPrice(p.price);

      return `
        <article class="card">
          <div class="media">
            <img
              src="${prodImg}"
              alt="${p.name}"
              loading="lazy"
              data-catsrc="${catImg}"
              onerror="this.onerror=null; this.src=this.dataset.catsrc || '${PLACEHOLDER_IMG}';"
            />
          </div>
          <h4>${p.name}</h4>
          <p class="meta">${p.brand || ""}</p>
          ${unit}
          <div class="actions">
            ${price ? `<span class="badge">${price}</span>` : ""}
            <a class="btn primary" href="${waUrl(
              p
            )}" target="_blank" rel="noopener">Consultar</a>
          </div>
        </article>
      `;
    })
    .join("");

  if (!filtered.length) {
    catalog.innerHTML = `<p class="muted">Sin resultados en esta categoría.</p>`;
  }
}

/* ---------- Events ---------- */
if (HAS_CATALOG) {
  catNav.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    const slug = btn.dataset.cat;
    const id = btn.dataset.id;
    state.cat = slug === "all" ? "all" : id || slug;

    [...catNav.querySelectorAll(".btn")].forEach((b) =>
      b.classList.toggle("is-active", b === btn)
    );

    renderProducts(ALL_PRODS);
    location.hash = `#cat=${slug}`;
    catalog.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* ---------- Boot ---------- */
(async () => {
  try {
    const fromHash = new URLSearchParams(location.hash.replace("#", "")).get(
      "cat"
    );
    if (fromHash) state.cat = fromHash;

    const DataAPI = window.DataAPI || {
      categories: () => fetch("data/categories.json").then((r) => r.json()),
      products: () => fetch("data/products.json").then((r) => r.json()),
    };

    ALL_CATS = await DataAPI.categories();
    buildCatIndexes(ALL_CATS);

    ALL_PRODS = await DataAPI.products();

    if (HAS_CATALOG) {
      renderNav(ALL_CATS);
      renderProducts(ALL_PRODS);
    }
  } catch (err) {
    console.error("[catalog] init failed:", err);
  }
})();
