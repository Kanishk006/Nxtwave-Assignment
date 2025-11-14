import { IDepartmentSubmission } from '../models/DepartmentSubmission.model';
import Department from '../models/Department.model';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';

/**
 * File Export Service
 * Handles exporting reports to JSON and CSV files
 */
class FileExportService {
  private reportsDir: string;

  constructor() {
    // Create reports directory in the project root
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.ensureReportsDirectory();
  }

  /**
   * Ensure reports directory exists
   */
  private async ensureReportsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      console.log('✅ Reports directory ready:', this.reportsDir);
    } catch (error) {
      console.error('❌ Failed to create reports directory:', error);
    }
  }

  /**
   * Generate file path for a report
   */
  private getReportPath(period: string, format: 'json' | 'csv'): string {
    const sanitizedPeriod = period.replace(/[^a-zA-Z0-9-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `master_report_${sanitizedPeriod}_${timestamp}.${format}`;
    return path.join(this.reportsDir, fileName);
  }

  /**
   * Publish Master Report to Files (JSON + CSV)
   * @param period - Report period (e.g., "2025-Q4")
   * @param submissions - Department submissions to publish
   * @returns Object with file paths
   */
  async publishMasterReport(
    period: string,
    submissions: IDepartmentSubmission[]
  ): Promise<{ jsonPath: string; csvPath: string; data: any }> {
    try {
      // Ensure directory exists
      await this.ensureReportsDirectory();

      // Prepare data
      const reportData = await this.prepareMasterReportData(period, submissions);

      // Save as JSON
      const jsonPath = this.getReportPath(period, 'json');
      await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2), 'utf-8');
      console.log('✅ JSON report saved:', jsonPath);

      // Save as CSV
      const csvPath = this.getReportPath(period, 'csv');
      const csvContent = this.convertToCSV(reportData);
      await fs.writeFile(csvPath, csvContent, 'utf-8');
      console.log('✅ CSV report saved:', csvPath);

      return {
        jsonPath,
        csvPath,
        data: reportData,
      };
    } catch (error: any) {
      console.error('❌ Failed to export report to files:', error);
      throw new Error(`Failed to export report: ${error.message}`);
    }
  }

  /**
   * Prepare master report data in structured format
   */
  private async prepareMasterReportData(
    period: string,
    submissions: IDepartmentSubmission[]
  ): Promise<any> {
    // Get all departments - handle department_id properly
    // First, collect all unique department IDs from submissions
    const departmentIds = new Set<any>();
    submissions.forEach((s) => {
      if (s.department_id) {
        if (typeof s.department_id === 'object') {
          // Check if it's a populated object with _id
          if ('_id' in s.department_id) {
            const deptId = (s.department_id as any)._id;
            departmentIds.add(deptId);
            // Also add as string for matching
            departmentIds.add(String(deptId));
          } else if ('toString' in s.department_id) {
            // It's an ObjectId
            departmentIds.add(s.department_id);
            departmentIds.add(String(s.department_id));
          }
        } else {
          // It's a string or primitive
          departmentIds.add(s.department_id);
          departmentIds.add(String(s.department_id));
        }
      }
    });
    
    // Convert to array and filter out duplicates/nulls
    const uniqueDeptIds = Array.from(departmentIds).filter(id => id !== null && id !== undefined);
    
    // Fetch departments using the collected IDs
    const departments = await Department.find({
      _id: { $in: uniqueDeptIds },
    });
    
    console.log('Fetched departments:', departments.map(d => ({ id: String(d._id), name: d.name })));
    console.log('Department IDs from submissions:', Array.from(departmentIds));

    // Create department map with multiple key formats for matching
    const deptMap = new Map<string, string>();
    departments.forEach((dept) => {
      const deptIdStr = String(dept._id);
      deptMap.set(deptIdStr, dept.name);
      // Also try with ObjectId directly
      if (dept._id) {
        deptMap.set(dept._id.toString(), dept.name);
        // Try with just the hex string (ObjectId has toHexString method)
        const deptIdObj = dept._id as any;
        if (deptIdObj && typeof deptIdObj.toHexString === 'function') {
          deptMap.set(deptIdObj.toHexString(), dept.name);
        }
      }
    });

    // Get all unique products
    const products = new Set<string>();
    submissions.forEach((submission) => {
      submission.items.forEach((item) => products.add(item.product));
    });
    const productList = Array.from(products).sort();

    // Build report data
    const reportData = {
      metadata: {
        period,
        generatedAt: new Date().toISOString(),
        totalDepartments: submissions.length,
        products: productList,
      },
      departments: submissions.map((submission) => {
        // Extract department name - handle all possible formats
        let deptName = 'Unknown';
        let deptId: any = null;
        
        // Extract department ID from submission
        if (submission.department_id) {
          if (typeof submission.department_id === 'object') {
            // Check if it's a populated object with name
            if ('name' in submission.department_id) {
              // If it's already populated, use the name directly
              deptName = (submission.department_id as any).name || 'Unknown';
            } else if ('_id' in submission.department_id) {
              // It's a populated object, get the _id
              deptId = (submission.department_id as any)._id;
            } else if ('toString' in submission.department_id) {
              // It's an ObjectId
              deptId = submission.department_id;
            }
          } else {
            // It's a string or primitive
            deptId = submission.department_id;
          }
        }
        
        // If we have a deptId but no name yet, look it up in the map
        if (deptName === 'Unknown' && deptId) {
          const deptIdStr = String(deptId);
          // Try multiple lookup formats
          deptName = deptMap.get(deptIdStr) || 
                     deptMap.get(deptId) || 
                     'Unknown';
          
          // If still not found, try ObjectId conversion
          if (deptName === 'Unknown') {
            try {
              const objId = typeof deptId === 'string' 
                ? new mongoose.Types.ObjectId(deptId) 
                : deptId;
              deptName = deptMap.get(String(objId)) || 
                         deptMap.get(objId.toString()) || 
                         'Unknown';
              // Try hex string
              if (deptName === 'Unknown' && (objId as any).toHexString) {
                deptName = deptMap.get((objId as any).toHexString()) || 'Unknown';
              }
            } catch (e) {
              console.warn(`Could not convert department ID: ${deptId}`, e);
            }
          }
        }
        
        // Final fallback - if still Unknown, log for debugging
        if (deptName === 'Unknown') {
          console.warn('Department name is Unknown for submission:', {
            department_id: submission.department_id,
            department_id_type: typeof submission.department_id,
            deptId: deptId,
            submission_id: (submission as any)._id,
            deptMap_keys: Array.from(deptMap.keys()),
          });
        }
        
        // Create product allocations object
        const allocations: any = {};
        productList.forEach((product) => {
          const item = submission.items.find((i) => i.product === product);
          allocations[product] = item ? item.percentage : 0;
        });

        return {
          department: deptName,
          ...allocations,
          status: submission.status,
          submittedAt: submission.submitted_at.toISOString(),
          approvedAt: submission.approved_at?.toISOString() || null,
          notes: submission.notes || '',
        };
      }),
      summary: this.calculateSummary(submissions, productList),
    };

    return reportData;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    submissions: IDepartmentSubmission[],
    productList: string[]
  ): any {
    const summary: any = {
      totalDepartments: submissions.length,
      productTotals: {},
      productAverages: {},
    };

    productList.forEach((product) => {
      const total = submissions.reduce((sum, submission) => {
        const item = submission.items.find((i) => i.product === product);
        return sum + (item ? item.percentage : 0);
      }, 0);

      const average = total / submissions.length;

      summary.productTotals[product] = Math.round(total * 100) / 100;
      summary.productAverages[product] = Math.round(average * 100) / 100;
    });

    return summary;
  }

  /**
   * Convert report data to CSV format (Excel-compatible)
   */
  private convertToCSV(reportData: any): string {
    const lines: string[] = [];

    // Column headers (no comments for Excel compatibility)
    const headers = ['Department', ...reportData.metadata.products, 'Status', 'Submitted At', 'Approved At', 'Notes'];
    lines.push(headers.map(h => this.escapeCSV(h)).join(','));

    // Data rows
    reportData.departments.forEach((dept: any) => {
      const row = [
        this.escapeCSV(dept.department),
        ...reportData.metadata.products.map((p: string) => dept[p] || 0),
        this.escapeCSV(dept.status || ''),
        this.escapeCSV(dept.submittedAt || ''),
        this.escapeCSV(dept.approvedAt || ''),
        this.escapeCSV(dept.notes || ''),
      ];
      lines.push(row.join(','));
    });

    // Summary section (separated by empty row)
    lines.push('');
    lines.push(['Metric', ...reportData.metadata.products.map((p: string) => this.escapeCSV(p))].join(','));
    
    const totalsRow = ['Total', ...reportData.metadata.products.map((p: string) => 
      reportData.summary.productTotals[p] || 0
    )];
    lines.push(totalsRow.join(','));

    const averagesRow = ['Average', ...reportData.metadata.products.map((p: string) => 
      reportData.summary.productAverages[p] || 0
    )];
    lines.push(averagesRow.join(','));

    // Use Windows line endings for better Excel compatibility
    return lines.join('\r\n');
  }

  /**
   * Escape CSV values (Excel-compatible)
   */
  private escapeCSV(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const str = String(value);
    
    // If value contains comma, newline, carriage return, or quotes, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }

  /**
   * Get list of all report files
   */
  async listReports(): Promise<string[]> {
    try {
      await this.ensureReportsDirectory();
      const files = await fs.readdir(this.reportsDir);
      return files.filter(file => 
        file.startsWith('master_report_') && 
        (file.endsWith('.json') || file.endsWith('.csv'))
      );
    } catch (error) {
      console.error('Failed to list reports:', error);
      return [];
    }
  }

  /**
   * Read a specific report file
   */
  async readReport(fileName: string): Promise<any> {
    try {
      const filePath = path.join(this.reportsDir, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (fileName.endsWith('.json')) {
        return JSON.parse(content);
      }
      
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read report: ${error.message}`);
    }
  }

  /**
   * Delete old reports (optional cleanup)
   */
  async deleteOldReports(daysOld: number = 90): Promise<number> {
    try {
      const files = await this.listReports();
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.reportsDir, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      console.log(`🗑️  Deleted ${deletedCount} old report(s)`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to delete old reports:', error);
      return 0;
    }
  }
}

export default new FileExportService();

