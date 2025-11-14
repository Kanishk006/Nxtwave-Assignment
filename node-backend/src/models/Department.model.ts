import mongoose, { Document, Schema } from 'mongoose';

/**
 * Department Interface
 */
export interface IDepartment extends Document {
  name: string;
  hod_user_id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Department Schema
 * Represents organizational departments
 */
const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    hod_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);

export default Department;

