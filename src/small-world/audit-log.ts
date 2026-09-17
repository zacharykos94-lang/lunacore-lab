export interface AuditEntry {
  sequence: number;
  event: string;
  taskId: string;
  messageId?: string;
  participantId?: string;
  note?: string;
}

export class CouncilAuditLog {
  private entries: AuditEntry[] = [];

  record(entry: Omit<AuditEntry, "sequence">): AuditEntry {
    const recorded: AuditEntry = {
      sequence: this.entries.length + 1,
      ...entry
    };
    this.entries.push(recorded);
    return recorded;
  }

  list(): AuditEntry[] {
    return [...this.entries];
  }
}
