export interface HistorySignal {
  label: string;
  relevance: number;   // 0-1
  confidence: number;  // 0-1
}

export interface ContextSnapshot {
  currentNeed?: string;
  statedPreference?: string;
  history: HistorySignal[];
}

export function contextWeight(snapshot: ContextSnapshot): number {
  if (snapshot.history.length === 0) return 0;

  const weighted = snapshot.history.reduce(
    (sum, signal) => sum + signal.relevance * signal.confidence,
    0
  );

  return Math.min(1, weighted / snapshot.history.length);
}