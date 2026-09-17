import {
  chooseAdaptiveSupport,
  type AdaptiveSupportDecision,
  type AdaptiveSupportInput
} from "./adaptive-support.js";
import {
  evaluateResourceShelter,
  type ResourceShelterDecision,
  type ResourceShelterInput
} from "./resource-shelter.js";
import {
  authorizeAction,
  type AuthorizationDecision,
  type AuthorizationRequest
} from "./human-authorization.js";
import {
  evaluatePhysicalInterface,
  type PhysicalInterfaceDecision,
  type PhysicalInterfaceInput
} from "./physical-interface.js";
import {
  evaluatePhysicalFeedback,
  type PhysicalFeedbackDecision,
  type PhysicalFeedbackInput
} from "./physical-feedback.js";
import {
  estimatePhysicalState,
  type PhysicalMeasurement,
  type PhysicalStateEstimateSet,
  type PhysicalVariableSpec
} from "./physical-state-estimator.js";

export interface LunaCoreInput {
  support: AdaptiveSupportInput;
  resources?: ResourceShelterInput;
  physical?: PhysicalInterfaceInput;
  physicalMeasurements?: PhysicalMeasurement[];
  physicalVariableSpecs?: PhysicalVariableSpec[];
  physicalFeedback?: PhysicalFeedbackInput;
  action?: AuthorizationRequest;
}

export interface LunaCoreDecision {
  support: AdaptiveSupportDecision;
  resources?: ResourceShelterDecision;
  physical?: PhysicalInterfaceDecision;
  physicalState?: PhysicalStateEstimateSet;
  physicalFeedback?: PhysicalFeedbackDecision;
  authorization?: AuthorizationDecision;
  humanReviewRequired: boolean;
}

export function runLunaCore(input: LunaCoreInput): LunaCoreDecision {
  const support = chooseAdaptiveSupport(input.support);
  const resources = input.resources
    ? evaluateResourceShelter(input.resources)
    : undefined;
  const physical = input.physical
    ? evaluatePhysicalInterface(input.physical)
    : undefined;
  const physicalState = input.physicalMeasurements
    ? estimatePhysicalState(
        input.physicalMeasurements,
        input.physicalVariableSpecs ?? []
      )
    : undefined;

  const estimatedObservations = physicalState?.estimates.map((estimate) => ({
    name: estimate.variable,
    value: estimate.value,
    confidence: estimate.confidence
  }));

  const physicalFeedback = input.physicalFeedback
    ? evaluatePhysicalFeedback({
        ...input.physicalFeedback,
        observations:
          input.physicalFeedback.observations?.length
            ? input.physicalFeedback.observations
            : estimatedObservations,
        readiness: input.physicalFeedback.readiness ?? physical?.readiness
      })
    : undefined;
  const authorization = input.action
    ? authorizeAction(input.action)
    : undefined;

  const unauthorisedPhysicalAction =
    (physical?.physicalActionRequiresAuthorization === true ||
      physicalFeedback?.physicalActionRequiresAuthorization === true) &&
    authorization?.authorized !== true;

  const humanReviewRequired =
    support.trace.humanReviewRequired ||
    authorization?.status === "approval-required" ||
    unauthorisedPhysicalAction;

  return {
    support,
    resources,
    physical,
    physicalState,
    physicalFeedback,
    authorization,
    humanReviewRequired
  };
}
