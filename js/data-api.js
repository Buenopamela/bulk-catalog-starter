// js/data-api.js
async function getJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Fetch ${path} failed: ${res.status}`);
  return res.json();
}

window.DataAPI = {
  categories: () => getJSON("data/categories.json"),
  products: () => getJSON("data/products.json"),
};
