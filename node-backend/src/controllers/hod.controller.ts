import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import EmployeeSubmission, { VALID_PRODUCTS, ProductType } from '../models/EmployeeSubmission.model';
import DepartmentSubmission from '../models/DepartmentSubmission.model';
import Employee from '../models/Employee.model';
import Department from '../models/Department.model';
import referenceService from '../services/reference.service';
import auditService from '../services/audit.service';

/**
 * HOD Controller
 * Handles Head of Department operations
 */
class HODController {
  /**
   * GET /api/departments/:id/submissions?period=2025-Q4
   * Get all employee submissions for a department and period
   */
  async getDepartmentSubmissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: departmentId } = req.params;
      const { period } = req.query;

      if (!period) {
        res.status(400).json({
          success: false,
          message: 'Period query parameter is required',
        });
        return;
      }

      // Get all employees in the department
      const employees = await Employee.find({ department_id: departmentId });
      const employeeIds = employees.map((emp) => emp._id);

      // Get all submissions for these employees in the period
      const submissions = await EmployeeSubmission.find({
        employee_id: { $in: employeeIds },
        period: period as string,
      }).populate('employee_id', 'emp_id first_name last_name email');

      // Group submissions by employee
      const groupedSubmissions = new Map();
      
      submissions.forEach((submission) => {
        const empId = submission.employee_id._id.toString();
        
        if (!groupedSubmissions.has(empId)) {
          groupedSubmissions.set(empId, {
            submission_ref: submission.submission_ref,
            employee: {
              emp_id: (submission.employee_id as any).emp_id,
              name: `${(submission.employee_id as any).first_name} ${(submission.employee_id as any).last_name}`,
              email: (submission.employee_id as any).email,
            },
            items: [],
            status: submission.approved ? 'approved' : 'pending',
          });
        }

        groupedSubmissions.get(empId).items.push({
          product: submission.product,
          percentage: submission.percentage,
          notes: submission.notes,
        });
      });

      res.json({
        success: true,
        department_id: departmentId,
        period,
        submissions: Array.from(groupedSubmissions.values()),
      });
    } catch (error: any) {
      console.error('Get department submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get department submissions',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/departments/:id/aggregate
   * Create department-level aggregate submission
   */
  async createDepartmentAggregate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: departmentId } = req.params;
      const { period, items, notes, auto_aggregate } = req.body;

      if (!period) {
        res.status(400).json({
          success: false,
          message: 'Period is required',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      // Check if already submitted for this period
      const existing = await DepartmentSubmission.findOne({
        department_id: departmentId,
        period,
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: `Department submission already exists for period ${period}. Status: ${existing.status}`,
          existing: {
            dept_submission_ref: existing.dept_submission_ref,
            status: existing.status,
            submitted_at: existing.submitted_at,
          },
        });
        return;
      }

      let aggregateItems = items;

      // Auto-aggregate from employee submissions if requested
      if (auto_aggregate) {
        const employees = await Employee.find({ department_id: departmentId });
        const employeeIds = employees.map((emp) => emp._id);

        // Get all submissions (both approved and pending) for aggregation
        const submissions = await EmployeeSubmission.find({
          employee_id: { $in: employeeIds },
          period,
        });

        if (submissions.length === 0) {
          res.status(400).json({
            success: false,
            message: 'No employee submissions found for this department and period. Cannot auto-aggregate.',
          });
          return;
        }

        // Group submissions by employee and submission_ref to get unique employee submission groups
        const uniqueSubmissions = new Map();
        submissions.forEach((submission) => {
          const key = `${submission.employee_id}_${submission.submission_ref}`;
          if (!uniqueSubmissions.has(key)) {
            uniqueSubmissions.set(key, []);
          }
          uniqueSubmissions.get(key).push(submission);
        });

        // Calculate department's total contribution to each product
        // This represents what percentage of the department's total effort goes to each product
        const productTotals = new Map<string, number>();
        let totalDepartmentAllocation = 0;

        uniqueSubmissions.forEach((empSubmissions: any[]) => {
          // For each employee's submission group, sum their percentages per product
          const empProductTotals = new Map<string, number>();
          empSubmissions.forEach((submission: any) => {
            const current = empProductTotals.get(submission.product) || 0;
            empProductTotals.set(submission.product, current + submission.percentage);
          });

          // Add each employee's product percentages to department totals
          empProductTotals.forEach((percentage, product) => {
            const deptTotal = productTotals.get(product) || 0;
            productTotals.set(product, deptTotal + percentage);
            totalDepartmentAllocation += percentage;
          });
        });

        // Calculate department contribution percentage to each product
        // Normalize to show what % of department's total allocation goes to each product
        if (totalDepartmentAllocation > 0) {
          // First, calculate raw percentages
          const rawItems = Array.from(productTotals.entries()).map(([product, total]) => {
            // Calculate percentage: (product total / department total) * 100
            const contributionPercentage = (total / totalDepartmentAllocation) * 100;
            return {
              product: product as ProductType,
              percentage: contributionPercentage,
            };
          });

          // Normalize to ensure sum is exactly 100%
          const sum = rawItems.reduce((acc: number, item: { product: ProductType; percentage: number }) => acc + item.percentage, 0);
          if (sum > 0) {
            aggregateItems = rawItems.map((item: { product: ProductType; percentage: number }) => ({
              product: item.product,
              percentage: Math.round((item.percentage / sum) * 10000) / 100, // Normalize and round to 2 decimal places
            }));

            // Adjust the largest item to ensure exact 100% sum
            const finalSum = aggregateItems.reduce((acc: number, item: { product: ProductType; percentage: number }) => acc + item.percentage, 0);
            if (Math.abs(finalSum - 100) > 0.01) {
              const diff = 100 - finalSum;
              // Add the difference to the largest percentage item
              const largestIndex = aggregateItems.reduce((maxIdx: number, item: { product: ProductType; percentage: number }, idx: number, arr: Array<{ product: ProductType; percentage: number }>) => 
                item.percentage > arr[maxIdx].percentage ? idx : maxIdx, 0
              );
              aggregateItems[largestIndex].percentage = Math.round((aggregateItems[largestIndex].percentage + diff) * 100) / 100;
            }
          } else {
            aggregateItems = [];
          }
        } else {
          aggregateItems = [];
        }

        // Ensure we have at least one item
        if (aggregateItems.length === 0) {
          res.status(400).json({
            success: false,
            message: 'No valid product allocations found in employee submissions. Cannot auto-aggregate.',
          });
          return;
        }
      }

      if (!aggregateItems || aggregateItems.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Items are required. Provide items array or set auto_aggregate to true.',
        });
        return;
      }

      // For manual submissions, normalize percentages to ensure they sum to exactly 100%
      if (!auto_aggregate) {
        const totalPercentage = aggregateItems.reduce((sum: number, item: { product: ProductType; percentage: number }) => sum + item.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          // Normalize percentages to sum to exactly 100%
          if (totalPercentage > 0) {
            aggregateItems = aggregateItems.map((item: { product: ProductType; percentage: number }) => ({
              product: item.product,
              percentage: Math.round((item.percentage / totalPercentage) * 10000) / 100,
            }));

            // Adjust the largest item to ensure exact 100% sum
            const finalSum = aggregateItems.reduce((acc: number, item: { product: ProductType; percentage: number }) => acc + item.percentage, 0);
            if (Math.abs(finalSum - 100) > 0.01) {
              const diff = 100 - finalSum;
              const largestIndex = aggregateItems.reduce((maxIdx: number, item: { product: ProductType; percentage: number }, idx: number, arr: Array<{ product: ProductType; percentage: number }>) => 
                item.percentage > arr[maxIdx].percentage ? idx : maxIdx, 0
              );
              aggregateItems[largestIndex].percentage = Math.round((aggregateItems[largestIndex].percentage + diff) * 100) / 100;
            }
          }
        }
      }

      // Generate unique reference
      const dept_submission_ref = await referenceService.generateUniqueRef('department');

      // Create department submission
      const departmentSubmission = await DepartmentSubmission.create({
        dept_submission_ref,
        department_id: departmentId,
        period,
        submitted_by: (req.user._id as any),
        status: 'submitted',
        items: aggregateItems,
        notes,
        submitted_at: new Date(),
      });

      // Log action
      await auditService.logFromRequest(
        req,
        'create_department_submission',
        'department_submission',
        (departmentSubmission._id as any).toString(),
        undefined,
        {
          dept_submission_ref,
          period,
          items: aggregateItems,
        }
      );

      res.status(201).json({
        success: true,
        message: 'Department submission created successfully',
        dept_submission_ref: departmentSubmission.dept_submission_ref,
        status: departmentSubmission.status,
        submitted_at: departmentSubmission.submitted_at,
      });
    } catch (error: any) {
      console.error('Create department aggregate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create department submission',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /api/departments/employee_submissions/:submissionRef
   * Update employee submission items and status (HOD review)
   * Updates all items for an employee's submission group
   */
  async updateEmployeeSubmission(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { submissionRef } = req.params;
      const { items, status } = req.body;

      if (!submissionRef) {
        res.status(400).json({
          success: false,
          message: 'Submission reference is required',
        });
        return;
      }

      // Get all submissions with this submission_ref
      const submissions = await EmployeeSubmission.find({ 
        submission_ref: submissionRef.toUpperCase() 
      }).populate('employee_id', 'department_id');

      if (!submissions || submissions.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Submission not found',
        });
        return;
      }

      // Verify HOD has access to this employee's department
      const employee = submissions[0].employee_id as any;
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      // Check if HOD can access this department
      let userDepartmentId: string;
      const deptId: any = req.user.department_id;
      if (deptId && typeof deptId === 'object') {
        if ('_id' in deptId && deptId._id) {
          userDepartmentId = String(deptId._id);
        } else {
          userDepartmentId = String(deptId);
        }
      } else if (deptId) {
        userDepartmentId = String(deptId);
      } else {
        res.status(403).json({
          success: false,
          message: 'User has no department assigned',
        });
        return;
      }

      if (String(employee.department_id) !== userDepartmentId && req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only update submissions from your department',
        });
        return;
      }

      // Store old values for audit
      const oldValues = submissions.map(sub => ({
        product: sub.product,
        percentage: sub.percentage,
        notes: sub.notes,
        approved: sub.approved,
      }));

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Validate items
        for (const item of items) {
          if (!item.product || !VALID_PRODUCTS.includes(item.product)) {
            res.status(400).json({
              success: false,
              message: `Invalid product: ${item.product}. Must be one of: ${VALID_PRODUCTS.join(', ')}`,
            });
            return;
          }
          if (item.percentage === undefined || item.percentage < 0 || item.percentage > 100) {
            res.status(400).json({
              success: false,
              message: `Invalid percentage for ${item.product}. Must be between 0 and 100`,
            });
            return;
          }
        }

        // Update or create submissions for each item
        for (const item of items) {
          let submission = submissions.find(s => s.product === item.product);
          
          if (submission) {
            // Update existing
            submission.percentage = item.percentage;
            if (item.notes !== undefined) {
              submission.notes = item.notes;
            }
            await submission.save();
          } else {
            // Check if submission already exists in DB (might not have been in initial query)
            const existingSubmission = await EmployeeSubmission.findOne({
              submission_ref: submissionRef.toUpperCase(),
              employee_id: employee._id,
              product: item.product,
            });

            if (existingSubmission) {
              // Update existing
              existingSubmission.percentage = item.percentage;
              if (item.notes !== undefined) {
                existingSubmission.notes = item.notes;
              }
              await existingSubmission.save();
            } else {
              // Create new submission for this product
              // Use findOneAndUpdate with upsert to avoid duplicate key errors
              await EmployeeSubmission.findOneAndUpdate(
                {
                  submission_ref: submissionRef.toUpperCase(),
                  employee_id: employee._id,
                  product: item.product,
                },
                {
                  submission_ref: submissionRef.toUpperCase(),
                  employee_id: employee._id,
                  period: submissions[0].period,
                  product: item.product,
                  percentage: item.percentage,
                  notes: item.notes || '',
                  source: 'hod_edit',
                  approved: false,
                },
                {
                  upsert: true,
                  new: true,
                  setDefaultsOnInsert: true,
                }
              );
            }
          }
        }

        // Delete submissions for products not in the new items list
        const itemProducts = items.map(i => i.product);
        for (const submission of submissions) {
          if (!itemProducts.includes(submission.product)) {
            await EmployeeSubmission.findByIdAndDelete(submission._id);
          }
        }
      }

      // Update status (approved) for all submissions
      if (status !== undefined) {
        const approved = status === 'approved' || status === true;
        await EmployeeSubmission.updateMany(
          { submission_ref: submissionRef.toUpperCase() },
          { approved }
        );
      }

      // Log action
      if (req.user) {
        await auditService.logFromRequest(
          req,
          'update_employee_submission',
          'employee_submission',
          submissionRef.toUpperCase(),
          oldValues,
          {
            items: items || submissions.map(s => ({
              product: s.product,
              percentage: s.percentage,
              notes: s.notes,
            })),
            status: status !== undefined ? status : (submissions[0].approved ? 'approved' : 'pending'),
          }
        );
      }

      res.json({
        success: true,
        message: 'Submission updated successfully',
        submission_ref: submissionRef.toUpperCase(),
      });
    } catch (error: any) {
      console.error('Update employee submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update submission',
        error: error.message,
      });
    }
  }

}

export default new HODController();

