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
import {
  evaluatePhysicalOutput,
  type PhysicalOutputDecision,
  type PhysicalOutputRequest
} from "./physical-output.js";
import {
  evaluatePhysicalConstraints,
  type PhysicalConstraint,
  type PhysicalConstraintDecision,
  type PhysicalTransitionProposal
} from "./physical-constraints.js";
import {
  buildPhysicalWorldModel,
  queryPhysicalWorldModel,
  type PhysicalWorldModelDecision,
  type PhysicalWorldModelInput,
  type PhysicalWorldQuery,
  type PhysicalWorldQueryDecision
} from "./physical-world-model.js";

export interface LunaCoreInput {
  support: AdaptiveSupportInput;
  resources?: ResourceShelterInput;
  physical?: PhysicalInterfaceInput;
  physicalWorld?: PhysicalWorldModelInput;
  physicalWorldQuery?: PhysicalWorldQuery;
  physicalMeasurements?: PhysicalMeasurement[];
  physicalVariableSpecs?: PhysicalVariableSpec[];
  physicalFeedback?: PhysicalFeedbackInput;
  physicalTransitions?: PhysicalTransitionProposal[];
  physicalConstraints?: PhysicalConstraint[];
  physicalOutput?: PhysicalOutputRequest;
  action?: AuthorizationRequest;
}

export interface LunaCoreDecision {
  support: AdaptiveSupportDecision;
  resources?: ResourceShelterDecision;
  physical?: PhysicalInterfaceDecision;
  physicalWorld?: PhysicalWorldModelDecision;
  physicalWorldQuery?: PhysicalWorldQueryDecision;
  physicalState?: PhysicalStateEstimateSet;
  physicalFeedback?: PhysicalFeedbackDecision;
  physicalConstraints?: PhysicalConstraintDecision;
  physicalOutput?: PhysicalOutputDecision;
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
  const physicalWorld = input.physicalWorld
    ? buildPhysicalWorldModel(input.physicalWorld)
    : undefined;
  const physicalWorldQuery =
    input.physicalWorld && input.physicalWorldQuery
      ? queryPhysicalWorldModel(input.physicalWorld, input.physicalWorldQuery)
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

  const physicalConstraints = input.physicalTransitions
    ? evaluatePhysicalConstraints(
        input.physicalTransitions,
        input.physicalConstraints ?? []
      )
    : undefined;

  const authorization = input.action
    ? authorizeAction(input.action)
    : undefined;

  const spatialTransitionUnknown =
    input.physicalOutput?.changesPhysicalState === true &&
    physicalWorldQuery !== undefined &&
    physicalWorldQuery.reachable !== true;

  const physicalOutput = input.physicalOutput
    ? evaluatePhysicalOutput(input.physicalOutput, {
        availableChannels: physical?.outputChannelsAvailable,
        feedbackDisposition:
          physicalConstraints?.status === "blocked" || spatialTransitionUnknown
            ? "observe"
            : physicalFeedback?.disposition,
        feedbackAdjustmentScale:
          physicalConstraints?.status === "blocked" || spatialTransitionUnknown
            ? 0
            : physicalFeedback?.adjustmentScale,
        authorized: authorization?.authorized
      })
    : undefined;

  const unauthorisedPhysicalAction =
    (physical?.physicalActionRequiresAuthorization === true ||
      physicalFeedback?.physicalActionRequiresAuthorization === true ||
      physicalConstraints?.physicalActionRequiresAuthorization === true ||
      physicalOutput?.status === "approval-required") &&
    authorization?.authorized !== true;

  const humanReviewRequired =
    support.trace.humanReviewRequired ||
    authorization?.status === "approval-required" ||
    physicalConstraints?.status === "review" ||
    physicalConstraints?.status === "blocked" ||
    spatialTransitionUnknown ||
    unauthorisedPhysicalAction;

  return {
    support,
    resources,
    physical,
    physicalWorld,
    physicalWorldQuery,
    physicalState,
    physicalFeedback,
    physicalConstraints,
    physicalOutput,
    authorization,
    humanReviewRequired
  };
}
