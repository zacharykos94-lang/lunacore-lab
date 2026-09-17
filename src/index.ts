import { runLunaCore } from "./core/lunacore.js";
import {
  faithGuidedValues,
  faithGuardrails
} from "./core/faith-values.js";

console.log("LunaCore v0.2 online.");

const exampleDecision = runLunaCore({
  support: {
    risk: {
      likelihood: 0.2,
      severity: 3,
      reversibility: 0.9,
      uncertainty: 0.2
    },
    context: {
      currentNeed: "quiet planning",
      statedPreference: "do not over-intervene",
      history: []
    },
    purpose: {
      statedPurpose: "review options without rushing",
      clarity: 0.9,
      alignment: 0.9
    },
    engagement: {
      intent: "observe",
      observationValue: 0.8
    },
    trace: {
      evidence: [
        {
          label: "human prefers observation before action",
          basis: "human-statement",
          confidence: 1
        }
      ],
      unknowns: ["future conditions may change"]
    }
  },
  resources: {
    shelterState: "secure",
    energy: {
      renewableGeneration: 8,
      essentialConsumption: 4,
      optionalConsumption: 1,
      reserve: 10,
      minimumReserve: 5
    }
  },
  action: {
    actionClass: "analysis",
    externalEffect: false
  }
});

console.log({
  faithGuidedValues,
  faithGuardrails,
  exampleDecision
});
