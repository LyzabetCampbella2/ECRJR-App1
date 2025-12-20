# ECRJR — Master Result Schema (Canonical)

**System:** Echoryn Creative Raveliquarith Judgment Rhemex (ECRJR)  
**Purpose:** Single source of truth for all final user results.

## Master Result Object
A completed ECRJR cycle MUST resolve into exactly one Result object with the following structure.

### Required Top-Level Fields
- userId (string)
- completedAt (ISO datetime string)
- primaryArchetype (object)
- shadowPatterns (array)
- luminaryExpressions (array)
- integrationAxis (object)
- raveliquarithSummary (object)

## JSON Shape (Canonical)
```json
{
  "userId": "string",
  "completedAt": "2025-12-16T00:00:00.000Z",
  "primaryArchetype": {
    "archetypeId": "string",
    "name": "string",
    "sphere": "string",
    "family": "string",
    "coreDrive": "string",
    "creativeExpression": "string",
    "distortionRisk": "string",
    "integrationNote": "string"
  },
  "shadowPatterns": [
    {
      "shadowId": "string",
      "name": "string",
      "triggerCondition": "string",
      "behavioralLoop": "string",
      "protectiveFunction": "string",
      "releasePath": "string"
    }
  ],
  "luminaryExpressions": [
    {
      "luminaryId": "string",
      "name": "string",
      "activationCondition": "string",
      "expressionState": "string",
      "creativeContribution": "string",
      "integrationRequirement": "string"
    }
  ],
  "integrationAxis": {
    "tension": "string",
    "growthVector": "string",
    "stabilizingPractice": "string"
  },
  "raveliquarithSummary": {
    "interpretiveFocus": "string",
    "keyPattern": "string",
    "judgmentStatement": "string"
  }
}
## Rendering Order (Frontend Contract)
Results must be rendered in the following sequence:
1. Archetype
2. Shadow
3. Luminary
4. Integration Axis
5. Raveliquarith Summary

No scores, charts, or comparative visuals are permitted.
## Finality Rule
The Result object represents the only completed output of the ECRJR system.
No partial or alternative results are exposed.
