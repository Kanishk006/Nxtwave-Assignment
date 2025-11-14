import mongoose, { Document, Schema } from 'mongoose';

/**
 * Employee Interface
 */
export interface IEmployee extends Document {
  emp_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  department_id: mongoose.Types.ObjectId;
  role?: string;
  location?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Employee Schema
 * Stores employee master data
 */
const EmployeeSchema = new Schema<IEmployee>(
  {
    emp_id: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    first_name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    department_id: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    role: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
EmployeeSchema.index({ emp_id: 1 });
EmployeeSchema.index({ department_id: 1 });

const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;

