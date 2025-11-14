import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Interface
 * Represents users in the system (HOD or Admin)
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: 'hod' | 'admin';
  department_id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema
 * Users can be either HOD (Head of Department) or Admin
 */
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password_hash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: ['hod', 'admin'],
        message: 'Role must be either hod or admin',
      },
    },
    department_id: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: function (this: IUser) {
        return this.role === 'hod';
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;

