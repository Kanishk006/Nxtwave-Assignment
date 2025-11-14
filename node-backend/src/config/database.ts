import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kanishkpodichetty_db_user:kanni2006@cluster0.myadidm.mongodb.net/employee_submissions';
    
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

export default connectDB;

