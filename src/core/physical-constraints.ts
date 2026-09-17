import { finiteOrNull } from "./physical-number.js";

export interface PhysicalConstraint {
  variable: string;
  minimum?: number;
  maximum?: number;
  maximumChange?: number;
  hard?: boolean;
}

export interface PhysicalTransitionProposal {
  variable: string;
  currentValue?: number;
  proposedValue?: number;
  confidence?: number; // 0-1
}

export type PhysicalConstraintStatus =
  | "unknown"
  | "within-envelope"
  | "review"
  | "blocked";

export interface PhysicalConstraintViolation {
  variable: string;
  constraint: "minimum" | "maximum" | "maximum-change";
  hard: boolean;
}

export interface PhysicalConstraintDecision {
  status: PhysicalConstraintStatus;
  violations: PhysicalConstraintViolation[];
  constraintsEvaluated: number;
  constraintsInvented: false;
  physicalActionRequiresAuthorization: boolean;
  reason: string;
}

export function evaluatePhysicalConstraints(
  proposals: PhysicalTransitionProposal[] = [],
  constraints: PhysicalConstraint[] = []
): PhysicalConstraintDecision {
  if (proposals.length === 0 || constraints.length === 0) {
    return {
      status: "unknown",
      violations: [],
      constraintsEvaluated: constraints.length,
      constraintsInvented: false,
      physicalActionRequiresAuthorization: proposals.length > 0,
      reason:
        "No complete physical constraint envelope is represented; do not invent missing limits."
    };
  }

  const constraintByVariable = new Map(
    constraints.map((constraint) => [constraint.variable, constraint])
  );
  const violations: PhysicalConstraintViolation[] = [];
  let evaluated = 0;
  let unknownProposal = false;

  for (const proposal of proposals) {
    const constraint = constraintByVariable.get(proposal.variable);
    const proposedValue = finiteOrNull(proposal.proposedValue);
    const currentValue = finiteOrNull(proposal.currentValue);
    const malformedConstraint = constraint !== undefined &&
      [constraint.minimum, constraint.maximum, constraint.maximumChange]
        .some((value) => value !== undefined && finiteOrNull(value) === null);
    if (!constraint || proposedValue === null || malformedConstraint) {
      unknownProposal = true;
      continue;
    }

    evaluated += 1;
    const hard = constraint.hard === true;

    if (
      constraint.minimum !== undefined &&
      proposedValue < constraint.minimum
    ) {
      violations.push({
        variable: proposal.variable,
        constraint: "minimum",
        hard
      });
    }

    if (
      constraint.maximum !== undefined &&
      proposedValue > constraint.maximum
    ) {
      violations.push({
        variable: proposal.variable,
        constraint: "maximum",
        hard
      });
    }

    if (
      constraint.maximumChange !== undefined &&
      proposal.currentValue !== undefined && currentValue === null
    ) {
      unknownProposal = true;
    } else if (
      constraint.maximumChange !== undefined &&
      currentValue !== null &&
      Math.abs(proposedValue - currentValue) >
        Math.max(0, constraint.maximumChange)
    ) {
      violations.push({
        variable: proposal.variable,
        constraint: "maximum-change",
        hard
      });
    }
  }

  if (violations.some((violation) => violation.hard)) {
    return {
      status: "blocked",
      violations,
      constraintsEvaluated: evaluated,
      constraintsInvented: false,
      physicalActionRequiresAuthorization: true,
      reason:
        "A proposed physical transition violates an explicitly supplied hard constraint."
    };
  }

  if (violations.length > 0 || unknownProposal) {
    return {
      status: "review",
      violations,
      constraintsEvaluated: evaluated,
      constraintsInvented: false,
      physicalActionRequiresAuthorization: true,
      reason:
        "The proposal has a soft constraint conflict or incomplete constraint information and should be reviewed before physical action."
    };
  }

  return {
    status: "within-envelope",
    violations: [],
    constraintsEvaluated: evaluated,
    constraintsInvented: false,
    physicalActionRequiresAuthorization: true,
    reason:
      "The represented proposal remains inside the supplied physical constraint envelope; authorization is still required before external action."
  };
}
