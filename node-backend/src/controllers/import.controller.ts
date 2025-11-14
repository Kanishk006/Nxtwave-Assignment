import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import csvService from '../services/csv.service';
import auditService from '../services/audit.service';

/**
 * Import Controller
 * Handles CSV imports for employees and submissions
 */
class ImportController {
  /**
   * POST /api/import/employees
   * Import employees from CSV file
   */
  async importEmployees(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded. Please upload a CSV file.',
        });
        return;
      }

      // Process CSV
      const result = await csvService.importEmployees(req.file.buffer);

      // Log import
      if (req.user) {
        await auditService.logFromRequest(
          req,
          'import_employees',
          'employee',
          undefined,
          undefined,
          {
            imported: result.imported,
            updated: result.updated,
            skipped: result.skipped,
            errorCount: result.errors.length,
          }
        );
      }

      res.json({
        success: true,
        message: 'Employee import completed',
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      });
    } catch (error: any) {
      console.error('Employee import error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import employees',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/import/submissions
   * Import employee submissions from CSV file
   */
  async importSubmissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded. Please upload a CSV file.',
        });
        return;
      }

      // Process CSV
      const result = await csvService.importEmployeeSubmissions(req.file.buffer);

      // Log import
      if (req.user) {
        await auditService.logFromRequest(
          req,
          'import_submissions',
          'employee_submission',
          undefined,
          undefined,
          {
            imported: result.imported,
            updated: result.updated,
            errorCount: result.errors.length,
          }
        );
      }

      res.json({
        success: true,
        message: 'Employee submissions import completed',
        imported: result.imported,
        updated: result.updated,
        errors: result.errors,
      });
    } catch (error: any) {
      console.error('Submissions import error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import submissions',
        error: error.message,
      });
    }
  }
}

export default new ImportController();

