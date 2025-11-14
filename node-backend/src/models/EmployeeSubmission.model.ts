import mongoose, { Document, Schema } from 'mongoose';

/**
 * Valid product types
 */
export const VALID_PRODUCTS = ['Academy', 'Intensive', 'NIAT'] as const;
export type ProductType = typeof VALID_PRODUCTS[number];

/**
 * Employee Submission Interface
 */
export interface IEmployeeSubmission extends Document {
  submission_ref: string;
  employee_id: mongoose.Types.ObjectId;
  period: string;
  product: ProductType;
  percentage: number;
  notes?: string;
  source: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Employee Submission Schema
 * Individual employee's product allocation submissions
 */
const EmployeeSubmissionSchema = new Schema<IEmployeeSubmission>(
  {
    submission_ref: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    employee_id: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },
    period: {
      type: String,
      required: [true, 'Period is required'],
      trim: true,
      // Format: 2025-Q4, 2025-Q1, etc.
      match: [/^\d{4}-Q[1-4]$/, 'Period must be in format YYYY-Q[1-4]'],
    },
    product: {
      type: String,
      required: [true, 'Product is required'],
      enum: {
        values: VALID_PRODUCTS,
        message: 'Product must be one of: Academy, Intensive, NIAT',
      },
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    notes: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      default: 'dummy',
      trim: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
EmployeeSubmissionSchema.index({ employee_id: 1, period: 1 });
EmployeeSubmissionSchema.index({ period: 1 });
EmployeeSubmissionSchema.index({ submission_ref: 1 });
// Unique constraint: same submission_ref + product + employee_id should be unique
EmployeeSubmissionSchema.index({ submission_ref: 1, employee_id: 1, product: 1 }, { unique: true });

const EmployeeSubmission = mongoose.model<IEmployeeSubmission>(
  'EmployeeSubmission',
  EmployeeSubmissionSchema
);

export default EmployeeSubmission;

