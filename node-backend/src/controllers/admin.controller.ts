import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import DepartmentSubmission from '../models/DepartmentSubmission.model';
import MasterReport from '../models/MasterReport.model';
import Department from '../models/Department.model';
import fileExportService from '../services/fileExport.service';
import auditService from '../services/audit.service';

/**
 * Admin Controller
 * Handles admin operations like review and publish
 */
class AdminController {
  /**
   * GET /api/admin/pending
   * Get all pending department submissions
   */
  async getPendingSubmissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { period, status } = req.query;

      const query: any = {};
      
      if (period) {
        query.period = period;
      }
      
      if (status) {
        query.status = status;
      } else {
        query.status = 'submitted'; // Default to pending submissions
      }

      const submissions = await DepartmentSubmission.find(query)
        .populate('department_id', 'name')
        .populate('submitted_by', 'name email')
        .sort({ submitted_at: -1 });

      res.json({
        success: true,
        count: submissions.length,
        submissions: submissions.map((sub) => ({
          id: sub._id,
          dept_submission_ref: sub.dept_submission_ref,
          department: (sub.department_id as any)?.name,
          period: sub.period,
          status: sub.status,
          items: sub.items,
          notes: sub.notes,
          submitted_by: {
            name: (sub.submitted_by as any)?.name,
            email: (sub.submitted_by as any)?.email,
          },
          submitted_at: sub.submitted_at,
          approved_at: sub.approved_at,
        })),
      });
    } catch (error: any) {
      console.error('Get pending submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending submissions',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /api/department_submissions/:id
   * Approve or reject a department submission
   */
  async reviewSubmission(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, rejection_reason, items } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Status is required (approved or rejected)',
        });
        return;
      }

      if (!['approved', 'rejected'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be either approved or rejected',
        });
        return;
      }

      const submission = await DepartmentSubmission.findById(id);

      if (!submission) {
        res.status(404).json({
          success: false,
          message: 'Submission not found',
        });
        return;
      }

      if (submission.status !== 'submitted') {
        res.status(400).json({
          success: false,
          message: `Cannot review submission with status: ${submission.status}`,
        });
        return;
      }

      // Store old values
      const oldValues = {
        status: submission.status,
        items: submission.items,
      };

      // Update submission
      submission.status = status;
      
      if (status === 'approved') {
        submission.approved_at = new Date();
        submission.approved_by = (req.user!._id as any);
        
        // Admin can modify items during approval
        if (items && Array.isArray(items)) {
          submission.items = items;
        }
      } else if (status === 'rejected') {
        submission.rejection_reason = rejection_reason;
      }

      await submission.save();

      // Log action
      await auditService.logFromRequest(
        req,
        status === 'approved' ? 'approve_submission' : 'reject_submission',
        'department_submission',
        (submission._id as any).toString(),
        oldValues,
        {
          status: submission.status,
          items: submission.items,
          rejection_reason: submission.rejection_reason,
        }
      );

      res.json({
        success: true,
        message: `Submission ${status} successfully`,
        submission: {
          id: submission._id,
          dept_submission_ref: submission.dept_submission_ref,
          status: submission.status,
          approved_at: submission.approved_at,
          rejection_reason: submission.rejection_reason,
        },
      });
    } catch (error: any) {
      console.error('Review submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review submission',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/admin/publish
   * Publish master report to files (JSON + CSV)
   */
  async publishMasterReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { period, overwrite } = req.body;

      if (!period) {
        res.status(400).json({
          success: false,
          message: 'Period is required',
        });
        return;
      }

      // Check if already published
      const existingReport = await MasterReport.findOne({ period, status: 'published' });
      
      if (existingReport && !overwrite) {
        res.status(409).json({
          success: false,
          message: `Master report already published for period ${period}`,
          existing: {
            id: existingReport._id,
            sheet_url: existingReport.sheet_url,
            published_at: existingReport.published_at,
          },
        });
        return;
      }

      // Get all approved submissions for the period
      // Populate department_id to get department name
      const approvedSubmissions = await DepartmentSubmission.find({
        period,
        status: 'approved',
      }).populate({
        path: 'department_id',
        select: 'name _id',
      });

      if (approvedSubmissions.length === 0) {
        res.status(400).json({
          success: false,
          message: `No approved submissions found for period ${period}`,
        });
        return;
      }

      // Create master report entry
      const masterReport = await MasterReport.create({
        period,
        published_by: req.user!._id,
        payload: approvedSubmissions.map((sub) => ({
          department: (sub.department_id as any)?.name,
          items: sub.items,
        })),
        status: 'publishing',
      });

      try {
        // Export to files (JSON + CSV)
        const exportResult = await fileExportService.publishMasterReport(
          period,
          approvedSubmissions
        );
        
        // Store file paths and full report data in master report
        masterReport.sheet_url = exportResult.jsonPath; // Repurpose this field for JSON path
        masterReport.status = 'published';
        
        // Store the full report data structure (same as JSON file)
        masterReport.payload = {
          ...exportResult.data, // This contains metadata, departments, summary
          jsonPath: exportResult.jsonPath,
          csvPath: exportResult.csvPath,
          exportedAt: new Date().toISOString(),
        };

        await masterReport.save();

        // Log action
        await auditService.logFromRequest(
          req,
          'publish_master_report',
          'master_report',
          (masterReport._id as any).toString(),
          undefined,
          {
            period,
            jsonPath: exportResult.jsonPath,
            csvPath: exportResult.csvPath,
            submission_count: approvedSubmissions.length,
          }
        );

        res.json({
          success: true,
          message: 'Master report published successfully to files',
          published: true,
          files: {
            json: exportResult.jsonPath,
            csv: exportResult.csvPath,
          },
          masterReportId: masterReport._id,
          period,
          submission_count: approvedSubmissions.length,
          data: exportResult.data,
        });
      } catch (publishError: any) {
        // Mark report as failed
        masterReport.status = 'failed';
        masterReport.error_message = publishError.message;
        await masterReport.save();

        res.status(500).json({
          success: false,
          message: 'Failed to export report to files',
          error: publishError.message,
        });
      }
    } catch (error: any) {
      console.error('Publish master report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to publish master report',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/master-reports
   * Get all published master reports
   */
  async getMasterReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { period } = req.query;

      const query: any = { status: 'published' };
      if (period) {
        query.period = period;
      }

      const reports = await MasterReport.find(query)
        .populate('published_by', 'name email')
        .sort({ published_at: -1 });

      res.json({
        success: true,
        count: reports.length,
        reports: reports.map((report) => ({
          id: report._id,
          period: report.period,
          published_at: report.published_at,
          published_by: {
            name: (report.published_by as any)?.name,
            email: (report.published_by as any)?.email,
          },
          payload: report.payload,
          status: report.status,
        })),
      });
    } catch (error: any) {
      console.error('Get master reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get master reports',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/master-reports/:id
   * Get a specific master report by ID
   */
  async getMasterReportById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const report = await MasterReport.findById(id)
        .populate('published_by', 'name email');

      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Master report not found',
        });
        return;
      }

      res.json({
        success: true,
        report: {
          id: report._id,
          period: report.period,
          published_at: report.published_at,
          published_by: {
            name: (report.published_by as any)?.name,
            email: (report.published_by as any)?.email,
          },
          payload: report.payload,
          status: report.status,
        },
      });
    } catch (error: any) {
      console.error('Get master report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get master report',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/master/:period
   * Preview master report before publishing
   */
  async previewMasterReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { period } = req.params;

      const approvedSubmissions = await DepartmentSubmission.find({
        period,
        status: 'approved',
      })

      console.log("approvedSubmissions", approvedSubmissions);

      if (approvedSubmissions.length === 0) {
        res.status(404).json({
          success: false,
          message: `No approved submissions found for period ${period}`,
        });
        return;
      }

      // Fetch all departments for the submissions that weren't populated
      const departmentIds = approvedSubmissions
        .map((sub) => {
          if (!sub.department_id) return null;
          if (typeof sub.department_id === 'object' && '_id' in sub.department_id) {
            return (sub.department_id as any)._id;
          }
          return sub.department_id;
        })
        .filter((id): id is any => id !== null);

        console.log(departmentIds, "This is the department ids");
      
      const departments = await Department.find({
        _id: { $in: departmentIds },
      });

      console.log(departments, "This is the departments");
      
      const deptMap = new Map<string, string>();
      departments.forEach((dept) => {
        deptMap.set(String(dept._id), dept.name);
      });

      // Build preview data
      const preview = approvedSubmissions.map((sub) => {
        //using the sub.department_id to get the department name
        const departmentName = deptMap.get(String(sub.department_id));

        console.log(sub.department_id, "This is the department id");
        console.log(departmentName, "This is the department name");
        
        return {
          department: departmentName || 'Unknown',
          period: sub.period,
          items: sub.items,
          submitted_at: sub.submitted_at,
          approved_at: sub.approved_at,
        };
      });

      res.json({
        success: true,
        period,
        count: approvedSubmissions.length,
        data: preview,
      });
    } catch (error: any) {
      console.error('Preview master report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview master report',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/reports/files
   * List all exported report files
   */
  async listReportFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const files = await fileExportService.listReports();
      
      res.json({
        success: true,
        count: files.length,
        files: files.sort().reverse(), // Most recent first
      });
    } catch (error: any) {
      console.error('List report files error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list report files',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/reports/file/:fileName
   * Get a specific report file content (download)
   */
  async getReportFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { fileName } = req.params;
      
      const content = await fileExportService.readReport(fileName);
      
      // If it's a CSV file, send it with proper headers for download
      if (fileName.endsWith('.csv')) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(content);
        return;
      }
      
      // For JSON files, return as JSON response
      res.json({
        success: true,
        fileName,
        content,
      });
    } catch (error: any) {
      console.error('Get report file error:', error);
      res.status(404).json({
        success: false,
        message: 'Report file not found',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/audit/:entity/:id
   * Get audit logs for a specific entity
   */
  async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { entity, id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const logs = await auditService.getEntityLogs(entity, id, limit);

      res.json({
        success: true,
        count: logs.length,
        logs: logs.map((log) => ({
          id: log._id,
          actor: (log.actor_id as any)?.name,
          action_type: log.action_type,
          old_value: log.old_value,
          new_value: log.new_value,
          createdAt: log.createdAt,
        })),
      });
    } catch (error: any) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit logs',
        error: error.message,
      });
    }
  }
}

export default new AdminController();

