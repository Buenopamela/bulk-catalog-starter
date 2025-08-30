const catNav = document.getElementById("cat-nav");
const catalog = document.getElementById("catalog");
const HAS_CATALOG = !!(catNav && catalog);

// ---- State ----
let ALL_CATS = [];
let ALL_PRODS = [];
const state = { cat: "all" }; // 'all' | categoryId | categorySlug

// ---- Config ----
const WHATSAPP = { phone: "5491163581814" }; // ← set your phone once here
// Built-in SVG placeholder so we don't depend on a file being present
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
      <rect width='100%' height='100%' fill='#111216'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            fill='#333' font-family='system-ui, -apple-system, Segoe UI, Roboto'
            font-size='22'>Imagen no disponible</text>
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

// ---- Renderers ----
function renderNav(cats) {
  if (!HAS_CATALOG) return;
  // No icons in pills — just names
  const pills = [{ slug: "all", name: "Todos" }, ...cats]
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
  catNav.innerHTML = pills;
}

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
      const imgSrc = p.image && p.image.trim() ? p.image : PLACEHOLDER_IMG;
      const unit = p.unit ? `<small class="meta">${p.unit}</small>` : "";
      const price = fmtPrice(p.price);

      return `
        <article class="card">
          <img
            src="${imgSrc}"
            alt="${p.name}"
            loading="lazy"
            onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}'; this.alt='';"
          />
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

// ---- Events ----
if (HAS_CATALOG) {
  catNav.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    const slug = btn.dataset.cat;
    const id = btn.dataset.id;
    state.cat = slug === "all" ? "all" : id || slug;

    // Active pill
    [...catNav.querySelectorAll(".btn")].forEach((b) =>
      b.classList.toggle("is-active", b === btn)
    );

    renderProducts(ALL_PRODS);
    // Persist deep-link
    location.hash = `#cat=${slug}`;
    // UX: scroll to products on mobile
    catalog.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// ---- Boot ----
(async () => {
  try {
    // Read deep-link (#cat=slug)
    const fromHash = new URLSearchParams(location.hash.replace("#", "")).get(
      "cat"
    );
    if (fromHash) state.cat = fromHash;

    // Data loader from data-api.js; fallback to direct fetch if not present
    const DataAPI = window.DataAPI || {
      categories: () => fetch("data/categories.json").then((r) => r.json()),
      products: () => fetch("data/products.json").then((r) => r.json()),
    };

    ALL_CATS = await DataAPI.categories();
    ALL_PRODS = await DataAPI.products();

    if (HAS_CATALOG) {
      renderNav(ALL_CATS);
      renderProducts(ALL_PRODS);
    }
  } catch (err) {
    console.error("[catalog] init failed:", err);
  }
})();
