import Archetype from "../models/Archetype.js";
import { scoreSubmission, argmax, pickArchetype } from "../utils/archetypeScoring.js";

// You can load questions from DB or from JSON test bank.
// For now assume you import/load them.
import archetypeTestBank from "../data/testBanks/archetypeTest.bank.json" assert { type: "json" };

export async function submitArchetypeTest(req, res) {
  try {
    const { profileId, answers } = req.body; // answers: number[] option indices
    if (!profileId) return res.status(400).json({ message: "profileId required" });
    if (!Array.isArray(answers)) return res.status(400).json({ message: "answers must be array" });

    const questions = archetypeTestBank.questions;
    if (!questions?.length) return res.status(500).json({ message: "Test bank missing questions" });

    const { gate1, gate2, gate3 } = scoreSubmission(questions, answers);

    // Gate 1 sphere key: "cognitive" | "relational" | ...
    const sphereKey = argmax(gate1);

    // Gate 2 family id: "family_translators" etc (since we used IDs in scoring)
    const familyId = argmax(gate2);

    // Pull candidate archetypes from DB (family filter)
    const familyArchetypes = await Archetype.find({ "family.id": familyId }).lean();

    const { best, match } = pickArchetype(familyArchetypes, familyId, gate3);
    if (!best) return res.status(404).json({ message: "No archetypes found for family", familyId });

    // TODO: store on Profile/TestResult model
    // Example: you probably have a Profile model; update it here.
    // await Profile.findByIdAndUpdate(profileId, { $set: { archetypeResult: { ... } } });

    return res.json({
      sphereKey,
      familyId,
      archetypeId: best.id,
      archetypeName: best.name,
      matchScore: match,
      gate1,
      gate2,
      gate3
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "submitArchetypeTest failed", error: String(e?.message || e) });
  }
}
