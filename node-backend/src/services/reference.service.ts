import EmployeeSubmission from '../models/EmployeeSubmission.model';
import DepartmentSubmission from '../models/DepartmentSubmission.model';

/**
 * Reference Generation Service
 * Generates human-readable reference IDs for submissions
 */
class ReferenceService {
  /**
   * Generate Employee Submission Reference
   * Format: SUB001, SUB002, etc.
   */
  async generateEmployeeSubmissionRef(): Promise<string> {
    const count = await EmployeeSubmission.countDocuments();
    const nextNumber = count + 1;
    return `SUB${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Generate Department Submission Reference
   * Format: D_SUB_001, D_SUB_002, etc.
   */
  async generateDepartmentSubmissionRef(): Promise<string> {
    const count = await DepartmentSubmission.countDocuments();
    const nextNumber = count + 1;
    return `D_SUB_${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Generate unique reference with retry logic
   */
  async generateUniqueRef(
    type: 'employee' | 'department',
    maxRetries = 5
  ): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      const ref =
        type === 'employee'
          ? await this.generateEmployeeSubmissionRef()
          : await this.generateDepartmentSubmissionRef();

      // Check if ref already exists
      const Model = type === 'employee' ? EmployeeSubmission : DepartmentSubmission;
      let exists;
      if (type === 'employee') {
        exists = await (EmployeeSubmission as typeof EmployeeSubmission).findOne({ submission_ref: ref }).exec();
      } else {
        exists = await (DepartmentSubmission as typeof DepartmentSubmission).findOne({ dept_submission_ref: ref }).exec();
      }

      if (!exists) {
        return ref;
      }
    }

    // Fallback: add timestamp
    const timestamp = Date.now();
    const prefix = type === 'employee' ? 'SUB' : 'D_SUB';
    return `${prefix}_${timestamp}`;
  }
}

export default new ReferenceService();

