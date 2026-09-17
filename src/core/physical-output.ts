import type { PhysicalFeedbackDisposition } from "./physical-feedback.js";
import { boundedFinite, finiteOrNull } from "./physical-number.js";

export interface PhysicalOutputRequest {
  purpose?: string;
  preferredChannel?: string;
  requestedScale?: number; // 0-1
  externalEffect?: boolean;
  changesPhysicalState?: boolean;
  reversible?: boolean;
}

export interface PhysicalOutputContext {
  availableChannels?: string[];
  feedbackDisposition?: PhysicalFeedbackDisposition;
  feedbackAdjustmentScale?: number;
  authorized?: boolean;
}

export type PhysicalOutputStatus =
  | "observe"
  | "unavailable"
  | "approval-required"
  | "ready";

export interface PhysicalOutputDecision {
  status: PhysicalOutputStatus;
  eligibleChannels: string[];
  selectedChannel: string | null;
  outputScale: number;
  authorizationRequired: boolean;
  authorized: boolean;
  directDeviceCommandSpecified: false;
  mechanismSpecified: false;
  reason: string;
}

export function evaluatePhysicalOutput(
  request: PhysicalOutputRequest,
  context: PhysicalOutputContext = {}
): PhysicalOutputDecision {
  const availableChannels = context.availableChannels ?? [];
  const preferredAvailable = request.preferredChannel
    ? availableChannels.includes(request.preferredChannel)
    : false;
  const eligibleChannels = request.preferredChannel
    ? preferredAvailable
      ? [request.preferredChannel]
      : []
    : [...availableChannels];

  const selectedChannel = preferredAvailable
    ? request.preferredChannel ?? null
    : null;

  const requestedScaleMalformed = request.requestedScale !== undefined && finiteOrNull(request.requestedScale) === null;
  const feedbackScaleMalformed = context.feedbackAdjustmentScale !== undefined && finiteOrNull(context.feedbackAdjustmentScale) === null;
  const requestedScale = boundedFinite(request.requestedScale, requestedScaleMalformed ? 0 : 0.25);
  const feedbackScale = boundedFinite(
    context.feedbackAdjustmentScale,
    requestedScale
  );
  const changesPhysicalState = request.changesPhysicalState === true;
  const externalEffect = request.externalEffect !== false;
  const authorizationRequired = externalEffect;
  const authorized = !authorizationRequired || context.authorized === true;

  if (requestedScaleMalformed || (changesPhysicalState && feedbackScaleMalformed)) {
    return {
      status: "observe",
      eligibleChannels,
      selectedChannel,
      outputScale: 0,
      authorizationRequired,
      authorized,
      directDeviceCommandSpecified: false,
      mechanismSpecified: false,
      reason: "The requested or feedback-limited output scale is malformed; re-observe before physical output."
    };
  }

  if (
    changesPhysicalState &&
    (context.feedbackDisposition === "observe" ||
      context.feedbackDisposition === "hold")
  ) {
    return {
      status: "observe",
      eligibleChannels,
      selectedChannel,
      outputScale: 0,
      authorizationRequired,
      authorized,
      directDeviceCommandSpecified: false,
      mechanismSpecified: false,
      reason:
        "The feedback layer does not currently justify a physical state change; continue observing or hold the present state."
    };
  }

  if (request.preferredChannel && !preferredAvailable) {
    return {
      status: "unavailable",
      eligibleChannels,
      selectedChannel: null,
      outputScale: 0,
      authorizationRequired,
      authorized,
      directDeviceCommandSpecified: false,
      mechanismSpecified: false,
      reason:
        "The requested output channel is not currently represented as available."
    };
  }

  if (eligibleChannels.length === 0) {
    return {
      status: "unavailable",
      eligibleChannels,
      selectedChannel: null,
      outputScale: 0,
      authorizationRequired,
      authorized,
      directDeviceCommandSpecified: false,
      mechanismSpecified: false,
      reason:
        "No output channel is currently represented as available; do not invent a mechanism."
    };
  }

  if (!authorized) {
    return {
      status: "approval-required",
      eligibleChannels,
      selectedChannel,
      outputScale: 0,
      authorizationRequired,
      authorized: false,
      directDeviceCommandSpecified: false,
      mechanismSpecified: false,
      reason:
        "The output would affect the external world and is not currently authorized."
    };
  }

  const outputScale = changesPhysicalState
    ? Math.min(requestedScale, feedbackScale)
    : requestedScale;

  return {
    status: "ready",
    eligibleChannels,
    selectedChannel,
    outputScale,
    authorizationRequired,
    authorized: true,
    directDeviceCommandSpecified: false,
    mechanismSpecified: false,
    reason: selectedChannel
      ? "The requested abstract output channel is available and authorized; implementation remains mechanism-specific outside LunaCore."
      : "One or more output channels are eligible, but LunaCore has not selected or invented a mechanism."
  };
}
