import type { Participant } from "./contracts.js";

export interface RegistryDecision {
  participant?: Participant;
  eligible: boolean;
  reason: string;
}

export function findEligibleParticipant(
  participants: Participant[],
  participantId: string,
  requiredCapability?: string
): RegistryDecision {
  const matches = participants.filter((item) => item.id === participantId);

  if (matches.length === 0) {
    return {
      eligible: false,
      reason: "The requested participant is not registered."
    };
  }

  if (matches.length > 1) {
    return {
      eligible: false,
      reason: "The participant identity is ambiguous because the registry contains duplicate ids."
    };
  }

  const participant = matches[0];

  if (!participant.active) {
    return {
      participant,
      eligible: false,
      reason: "The participant is registered but inactive."
    };
  }

  if (
    requiredCapability &&
    !participant.capabilities.includes(requiredCapability)
  ) {
    return {
      participant,
      eligible: false,
      reason: "The participant has not declared the required capability."
    };
  }

  return {
    participant,
    eligible: true,
    reason: "The participant is active and satisfies the declared capability requirement."
  };
}

export function assertRemoteVerified(participant: Participant): RegistryDecision {
  if (participant.provenance !== "remote-verified") {
    return {
      participant,
      eligible: false,
      reason: "Independent remote status requires verified remote provenance."
    };
  }

  return {
    participant,
    eligible: true,
    reason: "The participant is explicitly marked as remote-verified."
  };
}
