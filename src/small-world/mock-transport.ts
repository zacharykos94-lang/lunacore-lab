import type { CouncilMessage } from "./contracts.js";
import { CouncilAuditLog } from "./audit-log.js";

export interface DeliveryResult {
  delivered: boolean;
  duplicate: boolean;
  cancelled: boolean;
  reason: string;
}

export class MockCouncilTransport {
  private delivered = new Set<string>();
  private cancelledTasks = new Set<string>();

  constructor(private readonly audit = new CouncilAuditLog()) {}

  cancelTask(taskId: string): void {
    this.cancelledTasks.add(taskId);
    this.audit.record({ taskId, event: "task-cancelled" });
  }

  send(message: CouncilMessage): DeliveryResult {
    if (this.cancelledTasks.has(message.taskId)) {
      this.audit.record({
        taskId: message.taskId,
        messageId: message.messageId,
        event: "delivery-blocked-cancelled"
      });
      return {
        delivered: false,
        duplicate: false,
        cancelled: true,
        reason: "The task was cancelled before delivery."
      };
    }

    if (this.delivered.has(message.messageId)) {
      this.audit.record({
        taskId: message.taskId,
        messageId: message.messageId,
        event: "duplicate-rejected"
      });
      return {
        delivered: false,
        duplicate: true,
        cancelled: false,
        reason: "Duplicate message ids are rejected rather than replayed."
      };
    }

    this.delivered.add(message.messageId);
    this.audit.record({
      taskId: message.taskId,
      messageId: message.messageId,
      participantId: message.senderId,
      event: "delivered"
    });

    return {
      delivered: true,
      duplicate: false,
      cancelled: false,
      reason: "The mock transport delivered the message once."
    };
  }

  getAuditLog(): CouncilAuditLog {
    return this.audit;
  }
}
