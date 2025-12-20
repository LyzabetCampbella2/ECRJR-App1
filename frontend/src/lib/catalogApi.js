export async function fetchArchetypesCatalog() {
  const url = `/data/archetypesCatalog.json?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load catalog: HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error("Catalog JSON is not an array.");
  return json;
}
