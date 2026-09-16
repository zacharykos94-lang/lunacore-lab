import { chooseSupport } from "./core/active-support.js";
import {
  faithGuidedValues,
  faithGuardrails
} from "./core/faith-values.js";

console.log("LunaCore v0.1 scaffold online.");

console.log({
  faithGuidedValues,
  faithGuardrails,
  exampleDecision: chooseSupport({
    likelihood: 0.25,
    severity: 6,
    reversibility: 0.6,
    uncertainty: 0.4
  })
});