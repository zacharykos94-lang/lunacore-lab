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

export interface LunaCoreInput {
  support: AdaptiveSupportInput;
  resources?: ResourceShelterInput;
  action?: AuthorizationRequest;
}

export interface LunaCoreDecision {
  support: AdaptiveSupportDecision;
  resources?: ResourceShelterDecision;
  authorization?: AuthorizationDecision;
  humanReviewRequired: boolean;
}

export function runLunaCore(input: LunaCoreInput): LunaCoreDecision {
  const support = chooseAdaptiveSupport(input.support);
  const resources = input.resources
    ? evaluateResourceShelter(input.resources)
    : undefined;
  const authorization = input.action
    ? authorizeAction(input.action)
    : undefined;

  const humanReviewRequired =
    support.trace.humanReviewRequired ||
    authorization?.status === "approval-required";

  return {
    support,
    resources,
    authorization,
    humanReviewRequired
  };
}
