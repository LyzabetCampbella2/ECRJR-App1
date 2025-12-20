// src/pages/LuminaryLore.js
import React from "react";
import LoreEntryPage from "./LoreEntryPage";

/**
 * LuminaryLore
 * Route: /luminaries/:id
 *
 * This is a thin wrapper around the shared LoreEntryPage renderer.
 * It forces the type to "luminary" so:
 * - the badge shows "luminary"
 * - the page context/navigation stays consistent
 *
 * Your catalog lookup is handled inside LoreEntryPage via:
 *   src/data/archetypesCatalog.json
 *
 * Expected catalog entry shape:
 * {
 *   "id": "the-lantern-saint",
 *   "name": "The Lantern Saint",
 *   "type": "luminary",
 *   "summary": "...",
 *   "lore": { "overview": "...", "psychology": "...", ... }
 * }
 */
export default function LuminaryLore() {
  return <LoreEntryPage forcedType="luminary" />;
}
