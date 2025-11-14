/**
 * Script to drop the old unique index on submission_ref
 * Run this once to fix the duplicate key error
 * 
 * Usage: npx ts-node src/scripts/dropOldIndex.ts
 */

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function dropOldIndex() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kanishkpodichetty_db_user:kanni2006@cluster0.myadidm.mongodb.net/employee_submissions';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db?.collection('employeesubmissions');

    if (!collection) {
      console.error('❌ Collection not found');
      process.exit(1);
    }

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index: any) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check if the old unique index exists
    const oldIndex = indexes.find((idx: any) => idx.name === 'submission_ref_1' && idx.unique);
    
    if (oldIndex) {
      console.log('\n🗑️  Dropping old unique index on submission_ref...');
      await collection.dropIndex('submission_ref_1');
      console.log('✅ Old index dropped successfully');
    } else {
      console.log('\n✅ Old unique index on submission_ref does not exist');
    }

    // Verify indexes after
    const newIndexes = await collection.indexes();
    console.log('\n📋 Updated indexes:');
    newIndexes.forEach((index: any) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });

    console.log('\n✅ Done! You can now restart your server.');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 27) {
      console.log('ℹ️  Index does not exist, which is fine.');
    } else {
      console.error(error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

dropOldIndex();

