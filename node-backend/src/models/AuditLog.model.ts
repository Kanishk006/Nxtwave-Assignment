import mongoose, { Document, Schema } from 'mongoose';

/**
 * Audit Log Interface
 * Tracks all important actions in the system
 */
export interface IAuditLog extends Document {
  actor_id: mongoose.Types.ObjectId;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  createdAt: Date;
}

/**
 * Audit Log Schema
 * Immutable log of all system actions
 */
const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor ID is required'],
    },
    action_type: {
      type: String,
      required: [true, 'Action type is required'],
      trim: true,
      // Examples: 'create', 'update', 'delete', 'approve', 'reject', 'publish', 'import'
    },
    entity_type: {
      type: String,
      trim: true,
      // Examples: 'employee', 'employee_submission', 'department_submission', 'master_report'
    },
    entity_id: {
      type: String,
      trim: true,
    },
    old_value: {
      type: Schema.Types.Mixed,
    },
    new_value: {
      type: Schema.Types.Mixed,
    },
    ip_address: {
      type: String,
      trim: true,
    },
    user_agent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track creation
  }
);

// Indexes for querying audit logs
AuditLogSchema.index({ actor_id: 1, createdAt: -1 });
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ action_type: 1 });
AuditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;

