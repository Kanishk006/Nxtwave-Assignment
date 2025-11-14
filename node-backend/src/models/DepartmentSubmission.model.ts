import mongoose, { Document, Schema } from 'mongoose';
import { ProductType, VALID_PRODUCTS } from './EmployeeSubmission.model';

/**
 * Department Submission Item Interface
 */
export interface IDepartmentSubmissionItem {
  product: ProductType;
  percentage: number;
  notes?: string;
}

/**
 * Department Submission Status
 */
export type SubmissionStatus = 'submitted' | 'approved' | 'rejected';

/**
 * Department Submission Interface
 * HOD submits aggregated department-level data
 */
export interface IDepartmentSubmission extends Document {
  dept_submission_ref: string;
  department_id: mongoose.Types.ObjectId;
  period: string;
  submitted_by: mongoose.Types.ObjectId;
  status: SubmissionStatus;
  items: IDepartmentSubmissionItem[];
  notes?: string;
  submitted_at: Date;
  approved_at?: Date;
  approved_by?: mongoose.Types.ObjectId;
  rejection_reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Department Submission Item Schema
 */
const DepartmentSubmissionItemSchema = new Schema<IDepartmentSubmissionItem>(
  {
    product: {
      type: String,
      required: true,
      enum: VALID_PRODUCTS,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Department Submission Schema
 */
const DepartmentSubmissionSchema = new Schema<IDepartmentSubmission>(
  {
    dept_submission_ref: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    department_id: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
    },
    period: {
      type: String,
      required: [true, 'Period is required'],
      trim: true,
      match: [/^\d{4}-Q[1-4]$/, 'Period must be in format YYYY-Q[1-4]'],
    },
    submitted_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitter is required'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['submitted', 'approved', 'rejected'],
        message: 'Status must be submitted, approved, or rejected',
      },
      default: 'submitted',
    },
    items: {
      type: [DepartmentSubmissionItemSchema],
      required: true,
      validate: {
        validator: function (items: IDepartmentSubmissionItem[]) {
          return items.length > 0;
        },
        message: 'At least one item is required',
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    submitted_at: {
      type: Date,
      default: Date.now,
    },
    approved_at: {
      type: Date,
    },
    approved_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejection_reason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DepartmentSubmissionSchema.index({ department_id: 1, period: 1 });
DepartmentSubmissionSchema.index({ status: 1 });
DepartmentSubmissionSchema.index({ period: 1 });

const DepartmentSubmission = mongoose.model<IDepartmentSubmission>(
  'DepartmentSubmission',
  DepartmentSubmissionSchema
);

export default DepartmentSubmission;

