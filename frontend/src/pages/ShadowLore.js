// src/pages/ShadowLore.js
import React from "react";
import LoreEntryPage from "./LoreEntryPage";

/**
 * ShadowLore
 * Route: /shadows/:id
 *
 * Thin wrapper around the shared LoreEntryPage renderer.
 * It forces the type to "shadow" so:
 * - the badge shows "shadow"
 * - the page context/navigation stays consistent
 *
 * Data source (local fallback):
 *   src/data/archetypesCatalog.json
 *
 * Expected catalog entry shape:
 * {
 *   "id": "the-iron-hunger",
 *   "name": "The Iron Hunger",
 *   "type": "shadow",
 *   "summary": "...",
 *   "lore": {
 *     "overview": "...",
 *     "psychology": "...",
 *     "sociology": "...",
 *     "pedagogy": "...",
 *     "anthropology": "...",
 *     "symbols": "..."
 *   }
 * }
 */
export default function ShadowLore() {
  return <LoreEntryPage forcedType="shadow" />;
}
