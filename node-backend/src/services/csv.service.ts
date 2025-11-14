import csv from 'fast-csv';
import { Readable } from 'stream';
import Employee from '../models/Employee.model';
import EmployeeSubmission from '../models/EmployeeSubmission.model';
import Department from '../models/Department.model';
import { sanitizeCSVValue } from '../middleware/validation.middleware';
import referenceService from './reference.service';
import { VALID_PRODUCTS } from '../models/EmployeeSubmission.model';

/**
 * CSV Service
 * Handles CSV parsing and import logic
 */
class CSVService {
  /**
   * Parse CSV from buffer
   */
  private parseCSV<T>(buffer: Buffer): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const results: T[] = [];
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(csv.parse({ headers: true, trim: true }))
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Import Employees from CSV
   * Expected columns: emp_id, first_name, last_name, email, department, role, location, status
   */
  async importEmployees(buffer: Buffer): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const rows = await this.parseCSV<any>(buffer);
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because of header and 1-based indexing

      try {
        // Validate required fields
        if (!row.emp_id || !row.first_name || !row.last_name) {
          errors.push({
            row: rowNumber,
            message: 'Missing required fields: emp_id, first_name, last_name',
          });
          skipped++;
          continue;
        }

        // Sanitize inputs
        const emp_id = sanitizeCSVValue(row.emp_id).toUpperCase();
        const first_name = sanitizeCSVValue(row.first_name);
        const last_name = sanitizeCSVValue(row.last_name);
        const email = sanitizeCSVValue(row.email);
        const departmentName = sanitizeCSVValue(row.department);
        const role = sanitizeCSVValue(row.role);
        const location = sanitizeCSVValue(row.location);
        const status = sanitizeCSVValue(row.status) || 'active';

        // Find or create department
        let department = await Department.findOne({
          name: new RegExp(`^${departmentName}$`, 'i'),
        });

        if (!department) {
          department = await Department.create({ name: departmentName });
        }

        // Check if employee exists
        const existing = await Employee.findOne({ emp_id });

        if (existing) {
          // Update existing employee
          existing.first_name = first_name;
          existing.last_name = last_name;
          existing.email = email || existing.email;
          existing.department_id = department._id as any;
          existing.role = role || existing.role;
          existing.location = location || existing.location;
          existing.status = status;
          
          await existing.save();
          updated++;
        } else {
          // Create new employee
          await Employee.create({
            emp_id,
            first_name,
            last_name,
            email,
            department_id: department._id,
            role,
            location,
            status,
          });
          imported++;
        }
      } catch (error: any) {
        errors.push({
          row: rowNumber,
          message: error.message || 'Unknown error',
        });
        skipped++;
      }
    }

    return { imported, updated, skipped, errors };
  }

  /**
   * Import Employee Submissions from CSV
   * Expected columns: emp_id, period, product, percentage, notes, source
   */
  async importEmployeeSubmissions(buffer: Buffer): Promise<{
    imported: number;
    updated: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const rows = await this.parseCSV<any>(buffer);
    
    let imported = 0;
    let updated = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!row.emp_id || !row.period || !row.product || row.percentage === undefined) {
          errors.push({
            row: rowNumber,
            message: 'Missing required fields: emp_id, period, product, percentage',
          });
          continue;
        }

        const emp_id = sanitizeCSVValue(row.emp_id).toUpperCase();
        const period = sanitizeCSVValue(row.period);
        const product = sanitizeCSVValue(row.product);
        const percentage = parseFloat(row.percentage);
        const notes = sanitizeCSVValue(row.notes);
        const source = sanitizeCSVValue(row.source) || 'csv_import';

        // Validate period format
        if (!/^\d{4}-Q[1-4]$/.test(period)) {
          errors.push({
            row: rowNumber,
            message: `Invalid period format: ${period}. Expected YYYY-Q[1-4]`,
          });
          continue;
        }

        // Validate product
        if (!VALID_PRODUCTS.includes(product as any)) {
          errors.push({
            row: rowNumber,
            message: `Invalid product: ${product}. Must be one of: ${VALID_PRODUCTS.join(', ')}`,
          });
          continue;
        }

        // Validate percentage
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          errors.push({
            row: rowNumber,
            message: `Invalid percentage: ${row.percentage}. Must be between 0 and 100`,
          });
          continue;
        }

        // Find employee
        const employee = await Employee.findOne({ emp_id });
        
        if (!employee) {
          errors.push({
            row: rowNumber,
            message: `Employee not found: ${emp_id}`,
          });
          continue;
        }

        // Check if submission already exists for this employee, period, and product
        const existing = await EmployeeSubmission.findOne({
          employee_id: employee._id,
          period,
          product,
        });

        if (existing) {
          // Update existing submission
          existing.percentage = percentage;
          existing.notes = notes || existing.notes;
          existing.source = source;
          await existing.save();
          updated++;
        } else {
          // Generate unique reference
          const submission_ref = await referenceService.generateUniqueRef('employee');

          // Create new submission
          await EmployeeSubmission.create({
            submission_ref,
            employee_id: employee._id,
            period,
            product,
            percentage,
            notes,
            source,
          });
          imported++;
        }
      } catch (error: any) {
        errors.push({
          row: rowNumber,
          message: error.message || 'Unknown error',
        });
      }
    }

    return { imported, updated, errors };
  }
}

export default new CSVService();

