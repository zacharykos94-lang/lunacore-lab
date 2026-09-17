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
import {
  evaluatePhysicalChange,
  type PhysicalChangeDecision,
  type PhysicalChangeSpec,
  type TimedPhysicalObservation
} from "./physical-change-tracker.js";

export interface LunaCoreInput {
  support: AdaptiveSupportInput;
  resources?: ResourceShelterInput;
  physical?: PhysicalInterfaceInput;
  physicalWorld?: PhysicalWorldModelInput;
  physicalWorldQuery?: PhysicalWorldQuery;
  physicalMeasurements?: PhysicalMeasurement[];
  physicalVariableSpecs?: PhysicalVariableSpec[];
  physicalTimeline?: TimedPhysicalObservation[];
  physicalChangeSpecs?: PhysicalChangeSpec[];
  physicalCurrentTime?: number;
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
  physicalChange?: PhysicalChangeDecision;
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
  const physicalChange = input.physicalTimeline
    ? evaluatePhysicalChange(
        input.physicalTimeline,
        input.physicalChangeSpecs ?? [],
        input.physicalCurrentTime
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
  const requiredPhysicalStateStale =
    input.physicalOutput?.changesPhysicalState === true &&
    (physicalChange?.staleRequiredVariables.length ?? 0) > 0;

  const physicalOutput = input.physicalOutput
    ? evaluatePhysicalOutput(input.physicalOutput, {
        availableChannels: physical?.outputChannelsAvailable,
        feedbackDisposition:
          physicalConstraints?.status === "blocked" ||
          spatialTransitionUnknown ||
          requiredPhysicalStateStale
            ? "observe"
            : physicalFeedback?.disposition,
        feedbackAdjustmentScale:
          physicalConstraints?.status === "blocked" ||
          spatialTransitionUnknown ||
          requiredPhysicalStateStale
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
    requiredPhysicalStateStale ||
    unauthorisedPhysicalAction;

  return {
    support,
    resources,
    physical,
    physicalWorld,
    physicalWorldQuery,
    physicalState,
    physicalChange,
    physicalFeedback,
    physicalConstraints,
    physicalOutput,
    authorization,
    humanReviewRequired
  };
}
