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

export interface LunaCoreInput {
  support: AdaptiveSupportInput;
  resources?: ResourceShelterInput;
  physical?: PhysicalInterfaceInput;
  action?: AuthorizationRequest;
}

export interface LunaCoreDecision {
  support: AdaptiveSupportDecision;
  resources?: ResourceShelterDecision;
  physical?: PhysicalInterfaceDecision;
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
  const authorization = input.action
    ? authorizeAction(input.action)
    : undefined;

  const unauthorisedPhysicalAction =
    physical?.physicalActionRequiresAuthorization === true &&
    authorization?.authorized !== true;

  const humanReviewRequired =
    support.trace.humanReviewRequired ||
    authorization?.status === "approval-required" ||
    unauthorisedPhysicalAction;

  return {
    support,
    resources,
    physical,
    authorization,
    humanReviewRequired
  };
}
