import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Department from '../models/Department.model';
import Employee from '../models/Employee.model';
import EmployeeSubmission from '../models/EmployeeSubmission.model';

dotenv.config();

/**
 * Seed Database Script
 * Creates sample users, departments, employees, and submissions
 */
async function seed() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kanishkpodichetty_db_user:kanni2006@cluster0.myadidm.mongodb.net/employee_submissions';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Employee.deleteMany({});
    await EmployeeSubmission.deleteMany({});

    // Create Departments
    console.log('📦 Creating departments...');
    const techDept = await Department.create({ name: 'Tech' });
    const salesDept = await Department.create({ name: 'Sales' });
    const designDept = await Department.create({ name: 'Design' });

    // Create Admin User
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password_hash: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
    });

    // Create HOD Users
    console.log('👤 Creating HOD users...');
    const hodTech = await User.create({
      name: 'HOD Tech',
      email: 'hod.tech@example.com',
      password_hash: 'pass123',
      role: 'hod',
      department_id: techDept._id,
    });

    const hodSales = await User.create({
      name: 'HOD Sales',
      email: 'hod.sales@example.com',
      password_hash: 'pass123',
      role: 'hod',
      department_id: salesDept._id,
    });

    const hodDesign = await User.create({
      name: 'HOD Design',
      email: 'hod.design@example.com',
      password_hash: 'pass123',
      role: 'hod',
      department_id: designDept._id,
    });

    // Update departments with HOD references
    techDept.hod_user_id = hodTech._id as any;
    await techDept.save();
    
    salesDept.hod_user_id = hodSales._id as any;
    await salesDept.save();
    
    designDept.hod_user_id = hodDesign._id as any;
    await designDept.save();

    // Create Sample Employees
    console.log('👥 Creating employees...');
    const employees = [
      // Tech Department
      {
        emp_id: 'EMP001',
        first_name: 'Arjun',
        last_name: 'Sharma',
        email: 'arjun.sharma@example.com',
        department_id: techDept._id,
        role: 'Developer',
        location: 'Bangalore',
        status: 'active',
      },
      {
        emp_id: 'EMP002',
        first_name: 'Priya',
        last_name: 'Patel',
        email: 'priya.patel@example.com',
        department_id: techDept._id,
        role: 'Developer',
        location: 'Mumbai',
        status: 'active',
      },
      {
        emp_id: 'EMP003',
        first_name: 'Raj',
        last_name: 'Kumar',
        email: 'raj.kumar@example.com',
        department_id: techDept._id,
        role: 'Developer',
        location: 'Delhi',
        status: 'active',
      },
      // Sales Department
      {
        emp_id: 'EMP004',
        first_name: 'Sneha',
        last_name: 'Singh',
        email: 'sneha.singh@example.com',
        department_id: salesDept._id,
        role: 'Sales Manager',
        location: 'Pune',
        status: 'active',
      },
      {
        emp_id: 'EMP005',
        first_name: 'Amit',
        last_name: 'Verma',
        email: 'amit.verma@example.com',
        department_id: salesDept._id,
        role: 'Sales Executive',
        location: 'Hyderabad',
        status: 'active',
      },
      // Design Department
      {
        emp_id: 'EMP006',
        first_name: 'Kavya',
        last_name: 'Reddy',
        email: 'kavya.reddy@example.com',
        department_id: designDept._id,
        role: 'UI/UX Designer',
        location: 'Chennai',
        status: 'active',
      },
      {
        emp_id: 'EMP007',
        first_name: 'Rohit',
        last_name: 'Gupta',
        email: 'rohit.gupta@example.com',
        department_id: designDept._id,
        role: 'Graphic Designer',
        location: 'Kolkata',
        status: 'active',
      },
    ];

    const createdEmployees = await Employee.insertMany(employees);

    // Create Sample Employee Submissions for 2025-Q1, Q2, Q3, Q4 with varying percentages
    console.log('📊 Creating employee submissions...');
    const submissionsByQuarter: { [key: string]: Array<{ emp_id: string; product: string; percentage: number }> } = {
      '2025-Q1': [
        // Tech Department Employees
        { emp_id: 'EMP001', product: 'Academy', percentage: 55 },
        { emp_id: 'EMP001', product: 'NIAT', percentage: 45 },
        { emp_id: 'EMP002', product: 'Academy', percentage: 75 },
        { emp_id: 'EMP002', product: 'Intensive', percentage: 25 },
        { emp_id: 'EMP003', product: 'Academy', percentage: 65 },
        { emp_id: 'EMP003', product: 'NIAT', percentage: 35 },
        // Sales Department Employees
        { emp_id: 'EMP004', product: 'Intensive', percentage: 65 },
        { emp_id: 'EMP004', product: 'Academy', percentage: 35 },
        { emp_id: 'EMP005', product: 'Intensive', percentage: 75 },
        { emp_id: 'EMP005', product: 'NIAT', percentage: 25 },
        // Design Department Employees
        { emp_id: 'EMP006', product: 'NIAT', percentage: 85 },
        { emp_id: 'EMP006', product: 'Academy', percentage: 15 },
        { emp_id: 'EMP007', product: 'NIAT', percentage: 55 },
        { emp_id: 'EMP007', product: 'Intensive', percentage: 45 },
      ],
      '2025-Q2': [
        // Tech Department Employees
        { emp_id: 'EMP001', product: 'Academy', percentage: 60 },
        { emp_id: 'EMP001', product: 'NIAT', percentage: 40 },
        { emp_id: 'EMP002', product: 'Academy', percentage: 80 },
        { emp_id: 'EMP002', product: 'Intensive', percentage: 20 },
        { emp_id: 'EMP003', product: 'Academy', percentage: 70 },
        { emp_id: 'EMP003', product: 'NIAT', percentage: 30 },
        // Sales Department Employees
        { emp_id: 'EMP004', product: 'Intensive', percentage: 70 },
        { emp_id: 'EMP004', product: 'Academy', percentage: 30 },
        { emp_id: 'EMP005', product: 'Intensive', percentage: 80 },
        { emp_id: 'EMP005', product: 'NIAT', percentage: 20 },
        // Design Department Employees
        { emp_id: 'EMP006', product: 'NIAT', percentage: 90 },
        { emp_id: 'EMP006', product: 'Academy', percentage: 10 },
        { emp_id: 'EMP007', product: 'NIAT', percentage: 60 },
        { emp_id: 'EMP007', product: 'Intensive', percentage: 40 },
      ],
      '2025-Q3': [
        // Tech Department Employees
        { emp_id: 'EMP001', product: 'Academy', percentage: 50 },
        { emp_id: 'EMP001', product: 'NIAT', percentage: 50 },
        { emp_id: 'EMP002', product: 'Academy', percentage: 70 },
        { emp_id: 'EMP002', product: 'Intensive', percentage: 30 },
        { emp_id: 'EMP003', product: 'Academy', percentage: 75 },
        { emp_id: 'EMP003', product: 'NIAT', percentage: 25 },
        // Sales Department Employees
        { emp_id: 'EMP004', product: 'Intensive', percentage: 60 },
        { emp_id: 'EMP004', product: 'Academy', percentage: 40 },
        { emp_id: 'EMP005', product: 'Intensive', percentage: 85 },
        { emp_id: 'EMP005', product: 'NIAT', percentage: 15 },
        // Design Department Employees
        { emp_id: 'EMP006', product: 'NIAT', percentage: 80 },
        { emp_id: 'EMP006', product: 'Academy', percentage: 20 },
        { emp_id: 'EMP007', product: 'NIAT', percentage: 65 },
        { emp_id: 'EMP007', product: 'Intensive', percentage: 35 },
      ],
      '2025-Q4': [
        // Tech Department Employees
        { emp_id: 'EMP001', product: 'Academy', percentage: 65 },
        { emp_id: 'EMP001', product: 'NIAT', percentage: 35 },
        { emp_id: 'EMP002', product: 'Academy', percentage: 85 },
        { emp_id: 'EMP002', product: 'Intensive', percentage: 15 },
        { emp_id: 'EMP003', product: 'Academy', percentage: 60 },
        { emp_id: 'EMP003', product: 'NIAT', percentage: 40 },
        // Sales Department Employees
        { emp_id: 'EMP004', product: 'Intensive', percentage: 75 },
        { emp_id: 'EMP004', product: 'Academy', percentage: 25 },
        { emp_id: 'EMP005', product: 'Intensive', percentage: 70 },
        { emp_id: 'EMP005', product: 'NIAT', percentage: 30 },
        // Design Department Employees
        { emp_id: 'EMP006', product: 'NIAT', percentage: 95 },
        { emp_id: 'EMP006', product: 'Academy', percentage: 5 },
        { emp_id: 'EMP007', product: 'NIAT', percentage: 70 },
        { emp_id: 'EMP007', product: 'Intensive', percentage: 30 },
      ],
    };

    const quarters = ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4'];
    let submissionCounter = 1;

    for (const quarter of quarters) {
      const submissions = submissionsByQuarter[quarter];
      for (const sub of submissions) {
        const employee = createdEmployees.find((e) => e.emp_id === sub.emp_id);
        if (employee) {
          await EmployeeSubmission.create({
            submission_ref: `SUB${submissionCounter.toString().padStart(3, '0')}`,
            employee_id: employee._id,
            period: quarter,
            product: sub.product,
            percentage: sub.percentage,
            notes: `Sample submission for ${employee.first_name} - ${quarter}`,
            source: 'seed_script',
            approved: false,
          });
          submissionCounter++;
        }
      }
    }

    console.log('✅ Seed data created successfully!');
    console.log('\n📋 Summary:');
    console.log(`  - Departments: 3 (Tech, Sales, Design)`);
    console.log(`  - Users: 4 (1 admin, 3 HODs)`);
    console.log(`  - Employees: ${createdEmployees.length}`);
    console.log(`  - Employee Submissions: ${submissionCounter - 1} (across Q1, Q2, Q3, Q4)`);
    console.log('\n🔐 Login Credentials:');
    console.log(`  Admin: admin@example.com / admin123`);
    console.log(`  HOD Tech: hod.tech@example.com / pass123`);
    console.log(`  HOD Sales: hod.sales@example.com / pass123`);
    console.log(`  HOD Design: hod.design@example.com / pass123`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run seed
seed();
