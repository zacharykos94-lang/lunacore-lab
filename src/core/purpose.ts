export interface PurposeSnapshot {
  statedPurpose?: string;
  clarity: number;     // 0-1
  alignment: number;   // 0-1
}

export function purposeWeight(purpose: PurposeSnapshot): number {
  if (!purpose.statedPurpose) return 0;

  return Math.max(
    0,
    Math.min(1, purpose.clarity * purpose.alignment)
  );
}