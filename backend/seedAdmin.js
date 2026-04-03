import 'dotenv/config';
import { User, Role } from './models/index.js';
import sequelize from './models/index.js';
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'kantabbrichard@gmail.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Get or create admin role
    const adminRole = await Role.findOne({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('Admin role not found. Make sure to run the server first to initialize roles.');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Create admin user
    const adminUser = await User.create({
      email: 'kantabbrichard@gmail.com',
      password: hashedPassword,
      name: 'kantab Richard',
      roleId: adminRole.get('id') as string,
      status: 'active'
    });

    console.log('Admin user created successfully:');
    console.log(`Email: ${adminUser.get('email')}`);
    console.log(`Name: ${adminUser.get('name')}`);
    console.log(`Role: admin`);
    console.log(`Password: Admin123!`);

    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
