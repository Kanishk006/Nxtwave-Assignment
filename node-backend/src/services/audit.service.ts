import AuditLog from '../models/AuditLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Audit Service
 * Handles creation of audit log entries
 */
class AuditService {
  /**
   * Log an action to the audit trail
   */
  async log(params: {
    actor_id: string;
    action_type: string;
    entity_type?: string;
    entity_id?: string;
    old_value?: any;
    new_value?: any;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    try {
      await AuditLog.create(params);
    } catch (error) {
      console.error('❌ Failed to create audit log:', error);
      // Don't throw error - audit logging should not break the main flow
    }
  }

  /**
   * Log from Express Request
   */
  async logFromRequest(
    req: AuthRequest,
    action_type: string,
    entity_type?: string,
    entity_id?: string,
    old_value?: any,
    new_value?: any
  ): Promise<void> {
    if (!req.user) {
      console.warn('⚠️  Attempted to log audit without authenticated user');
      return;
    }

    const ip_address = req.ip || req.socket.remoteAddress;
    const user_agent = req.get('user-agent');

    await this.log({
      actor_id: (req.user._id as any).toString(),
      action_type,
      entity_type,
      entity_id,
      old_value,
      new_value,
      ip_address,
      user_agent,
    });
  }

  /**
   * Get audit logs for an entity
   */
  async getEntityLogs(entity_type: string, entity_id: string, limit = 50) {
    return AuditLog.find({ entity_type, entity_id })
      .populate('actor_id', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(actor_id: string, limit = 100) {
    return AuditLog.find({ actor_id })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(limit = 100) {
    return AuditLog.find()
      .populate('actor_id', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export default new AuditService();

