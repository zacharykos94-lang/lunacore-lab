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
import {
  evaluatePhysicalCapabilities,
  type PhysicalCapability,
  type PhysicalCapabilityDecision,
  type PhysicalCapabilityRequirement
} from "./physical-capabilities.js";
import {
  evaluatePhysicalResilience,
  type PhysicalResilienceDecision,
  type PhysicalSubsystemState
} from "./physical-resilience.js";
import {
  evaluatePhysicalEnergyDemand,
  type PhysicalEnergyDecision,
  type PhysicalEnergyDemand
} from "./physical-energy.js";
import {
  evaluatePhysicalReadiness,
  type PhysicalReadinessDecision
} from "./physical-readiness.js";

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
  physicalCapabilities?: PhysicalCapability[];
  physicalCapabilityRequirements?: PhysicalCapabilityRequirement[];
  physicalSubsystems?: PhysicalSubsystemState[];
  physicalEnergyDemand?: PhysicalEnergyDemand;
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
  physicalCapabilities?: PhysicalCapabilityDecision;
  physicalResilience?: PhysicalResilienceDecision;
  physicalEnergy?: PhysicalEnergyDecision;
  physicalFeedback?: PhysicalFeedbackDecision;
  physicalConstraints?: PhysicalConstraintDecision;
  physicalOutput?: PhysicalOutputDecision;
  physicalReadiness: PhysicalReadinessDecision;
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
  const physicalCapabilities =
    input.physicalCapabilities || input.physicalCapabilityRequirements
      ? evaluatePhysicalCapabilities(
          input.physicalCapabilities ?? [],
          input.physicalCapabilityRequirements ?? []
        )
      : undefined;
  const physicalResilience = input.physicalSubsystems
    ? evaluatePhysicalResilience(input.physicalSubsystems)
    : undefined;
  const physicalEnergy = input.physicalEnergyDemand
    ? evaluatePhysicalEnergyDemand(input.physicalEnergyDemand, resources)
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

  const stateChangingOutput =
    input.physicalOutput?.changesPhysicalState === true;
  const spatialTransitionUnknown =
    stateChangingOutput &&
    physicalWorldQuery !== undefined &&
    physicalWorldQuery.reachable !== true;
  const unresolvedSensorConflict =
    stateChangingOutput &&
    (physicalState?.conflictingVariables.length ?? 0) > 0;
  const requiredPhysicalStateStale =
    stateChangingOutput &&
    (physicalChange?.staleRequiredVariables.length ?? 0) > 0;
  const requiredCapabilityUnavailable =
    stateChangingOutput &&
    physicalCapabilities !== undefined &&
    physicalCapabilities.actionReady === false;
  const requiredSubsystemUnavailable =
    stateChangingOutput &&
    physicalResilience !== undefined &&
    physicalResilience.actionReady === false;
  const physicalEnergyUnavailable =
    stateChangingOutput &&
    physicalEnergy !== undefined &&
    physicalEnergy.actionReady === false;

  const physicalGateRequiresObservation =
    physicalConstraints?.status === "blocked" ||
    spatialTransitionUnknown ||
    unresolvedSensorConflict ||
    requiredPhysicalStateStale ||
    requiredCapabilityUnavailable ||
    requiredSubsystemUnavailable ||
    physicalEnergyUnavailable;

  const physicalOutput = input.physicalOutput
    ? evaluatePhysicalOutput(input.physicalOutput, {
        availableChannels: physical?.outputChannelsAvailable,
        feedbackDisposition: physicalGateRequiresObservation
          ? "observe"
          : physicalFeedback?.disposition,
        feedbackAdjustmentScale: physicalGateRequiresObservation
          ? 0
          : physicalFeedback?.adjustmentScale,
        authorized: authorization?.authorized
      })
    : undefined;

  const physicalReadiness = evaluatePhysicalReadiness({
    actionRequested: stateChangingOutput,
    interfaceReadiness: physical?.readiness,
    feedbackDisposition: physicalFeedback?.disposition,
    worldQuerySupplied: input.physicalWorldQuery !== undefined,
    worldReachable: physicalWorldQuery?.reachable,
    conflictingVariables: physicalState?.conflictingVariables,
    staleRequiredVariables: physicalChange?.staleRequiredVariables,
    capabilityActionReady: physicalCapabilities?.actionReady,
    resilienceActionReady: physicalResilience?.actionReady,
    energyStatus: physicalEnergy?.status,
    energyActionReady: physicalEnergy?.actionReady,
    constraintStatus: physicalConstraints?.status,
    authorizationStatus: authorization?.status,
    outputStatus: physicalOutput?.status
  });

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
    unresolvedSensorConflict ||
    requiredPhysicalStateStale ||
    requiredCapabilityUnavailable ||
    requiredSubsystemUnavailable ||
    physicalEnergy?.status === "review" ||
    physicalEnergy?.status === "blocked" ||
    physicalEnergy?.status === "unknown" ||
    physicalReadiness.status === "review" ||
    physicalReadiness.status === "blocked" ||
    unauthorisedPhysicalAction;

  return {
    support,
    resources,
    physical,
    physicalWorld,
    physicalWorldQuery,
    physicalState,
    physicalChange,
    physicalCapabilities,
    physicalResilience,
    physicalEnergy,
    physicalFeedback,
    physicalConstraints,
    physicalOutput,
    physicalReadiness,
    authorization,
    humanReviewRequired
  };
}
