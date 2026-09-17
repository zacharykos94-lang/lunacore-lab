export type ProvenanceMode =
  | "mock"
  | "local"
  | "remote-verified"
  | "human-supplied"
  | "tool-supplied";

export type CouncilRole =
  | "integrator"
  | "critic"
  | "synthesizer"
  | "researcher"
  | "experimenter"
  | "peer-reviewer"
  | "other";

export interface Participant {
  id: string;
  role: CouncilRole;
  capabilities: string[];
  provenance: ProvenanceMode;
  active: boolean;
}

export interface CouncilMessage {
  messageId: string;
  taskId: string;
  parentMessageId?: string;
  senderId: string;
  recipientIds: string[];
  kind: "task" | "report" | "ack" | "cancel" | "decision";
  claims?: string[];
  evidence?: string[];
  inferences?: string[];
  unknowns?: string[];
  confidence?: number;
  requestedCapability?: string;
  requestedAuthorization?: boolean;
  provenance: ProvenanceMode;
}

export interface CouncilReport {
  participantId: string;
  recommendation: string;
  evidence: string[];
  unknowns: string[];
  confidence: number;
  provenance: ProvenanceMode;
}

export interface HumanCouncilDecision {
  approved: boolean;
  rejected?: boolean;
  note?: string;
}

export interface CouncilSynthesis {
  taskId: string;
  reports: CouncilReport[];
  agreements: string[];
  disagreements: string[];
  minorityReports: CouncilReport[];
  humanReviewRequired: true;
  consequentialActionAuthorized: boolean;
  consensusIsAuthority: false;
  reason: string;
}
