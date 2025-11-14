import mongoose, { Document, Schema } from 'mongoose';

/**
 * Master Report Interface
 * Stores published reports and their Google Sheets links
 */
export interface IMasterReport extends Document {
  period: string;
  published_by: mongoose.Types.ObjectId;
  published_at: Date;
  sheet_url?: string;
  payload: any; // JSON payload of the report
  status: 'publishing' | 'published' | 'failed';
  error_message?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Master Report Schema
 */
const MasterReportSchema = new Schema<IMasterReport>(
  {
    period: {
      type: String,
      required: [true, 'Period is required'],
      trim: true,
      match: [/^\d{4}-Q[1-4]$/, 'Period must be in format YYYY-Q[1-4]'],
    },
    published_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Publisher is required'],
    },
    published_at: {
      type: Date,
      default: Date.now,
    },
    sheet_url: {
      type: String,
      trim: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['publishing', 'published', 'failed'],
      default: 'publishing',
    },
    error_message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for period lookups
MasterReportSchema.index({ period: 1 });
MasterReportSchema.index({ status: 1 });

const MasterReport = mongoose.model<IMasterReport>('MasterReport', MasterReportSchema);

export default MasterReport;

