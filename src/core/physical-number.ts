export function finiteOrNull(value: number | undefined): number | null {
  if (value === undefined || !Number.isFinite(value)) return null;
  return value;
}

export function boundedFinite(
  value: number | undefined,
  fallback = 0
): number {
  const finite = finiteOrNull(value);
  if (finite === null) return fallback;
  return Math.max(0, Math.min(1, finite));
}

export function nonNegativeFinite(
  value: number | undefined,
  fallback = 0
): number {
  const finite = finiteOrNull(value);
  if (finite === null) return fallback;
  return Math.max(0, finite);
}
