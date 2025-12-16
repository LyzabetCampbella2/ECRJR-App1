const testOrder = ["language_v1", "artist_v1", "archetype_v1", "shadow_v1", "luminary_v1"];

const realmMetadata = {
  language_v1:  { realm: "Language",  label: "Language Gate" },
  artist_v1:    { realm: "Artist",    label: "Artist Gate" },
  archetype_v1: { realm: "Archetype", label: "Archetype Gate" },
  shadow_v1:    { realm: "Shadow",    label: "Shadow Gate" },
  luminary_v1:  { realm: "Luminary",  label: "Luminary Gate" }
};

function getRealmForTest(testId) {
  return realmMetadata[testId] || { realm: "Unknown", label: "Unknown" };
}

function getNextTestById(currentTestId) {
  if (!currentTestId) return testOrder[0];
  const idx = testOrder.indexOf(currentTestId);
  if (idx === -1) return testOrder[0];
  return testOrder[idx + 1] || null; // null = done
}

module.exports = { testOrder, realmMetadata, getRealmForTest, getNextTestById };
