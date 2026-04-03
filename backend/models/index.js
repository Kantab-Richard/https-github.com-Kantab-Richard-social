import { Sequelize, DataTypes } from 'sequelize';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(rootDir, 'database.sqlite'),
  logging: false,
});

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'banned', 'pending'),
    defaultValue: 'active',
  },
});

export const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  step: {
    type: DataTypes.STRING,
  },
  platform: {
    type: DataTypes.STRING,
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  result: {
    type: DataTypes.JSON,
  },
  error: {
    type: DataTypes.TEXT,
  },
  UserId: {
    type: DataTypes.UUID,
    allowNull: true,
  }
});

export const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
  },
  permissions: {
    type: DataTypes.JSON, // Array of permission strings
    defaultValue: [],
  },
});

export const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  resource: {
    type: DataTypes.STRING, // e.g., 'users', 'jobs', 'admin'
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING, // e.g., 'read', 'write', 'delete', 'manage'
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
});

// Many-to-many relationship between roles and permissions
Role.belongsToMany(Permission, { through: 'RolePermissions' });
Permission.belongsToMany(Role, { through: 'RolePermissions' });

// Foreign key associations
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });
User.hasMany(Job, { foreignKey: 'UserId' });
Job.belongsTo(User, { foreignKey: 'UserId' });

export const initDb = async () => {
  try {
    // First try to sync without altering (safest option)
    await sequelize.authenticate();
    console.log('Successfully connected to SQLite database.');

    // Check if tables exist
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const existingTables = results.map((row) => row.name);

    if (existingTables.length === 0) {
      console.log('No tables found. Initializing fresh database schema...');
      await sequelize.sync();
    } else {
      // SQLite has limited ALTER support; disable foreign keys during sync to minimize validation errors
      console.log('Existing tables found. Syncing schema changes...');
      await sequelize.query('PRAGMA foreign_keys = OFF');
      await sequelize.sync({ alter: true });
      await sequelize.query('PRAGMA foreign_keys = ON');
    }
  } catch (error) {
    console.warn(`Schema sync alert: ${error.message}. This is common with SQLite ENUM/Constraint changes.`);
    
    // Only fallback to force sync in development to prevent accidental data loss in production
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Attempting force recreate as fallback...');
      try {
        await sequelize.query('PRAGMA foreign_keys = OFF');
        await sequelize.sync({ force: true });
        await sequelize.query('PRAGMA foreign_keys = ON');
      } catch (forceError) {
        console.error('Force sync also failed:', forceError.message);
        throw forceError;
      }
    } else {
      console.error('Critical: Database schema mismatch detected. Manual migration required.');
    }
  }

  // Initialize default roles and permissions (only if they don't exist)
  await initializeRolesAndPermissions();

  console.log('Database synced with role-based access control');
};

const initializeRolesAndPermissions = async () => {
  // Check if roles already exist
  const existingRoles = await Role.findAll();
  if (existingRoles.length > 0) {
    console.log('Roles and permissions already initialized');
    return;
  }

  // Create default permissions
  const permissions = [
    // User permissions
    { name: 'view_own_profile', resource: 'users', action: 'read', description: 'View own profile' },
    { name: 'update_own_profile', resource: 'users', action: 'update', description: 'Update own profile' },
    { name: 'create_job', resource: 'jobs', action: 'create', description: 'Create download jobs' },
    { name: 'view_own_jobs', resource: 'jobs', action: 'read', description: 'View own jobs' },
    { name: 'delete_own_jobs', resource: 'jobs', action: 'delete', description: 'Delete own jobs' },

    // Admin permissions
    { name: 'view_all_users', resource: 'users', action: 'read', description: 'View all users' },
    { name: 'manage_users', resource: 'users', action: 'manage', description: 'Full user management' },
    { name: 'view_all_jobs', resource: 'jobs', action: 'read', description: 'View all jobs' },
    { name: 'manage_jobs', resource: 'jobs', action: 'manage', description: 'Full job management' },
    { name: 'view_admin_stats', resource: 'admin', action: 'read', description: 'View admin statistics' },
    { name: 'manage_system', resource: 'admin', action: 'manage', description: 'Full system management' },
  ];

  for (const perm of permissions) {
    await Permission.findOrCreate({
      where: { name: perm.name },
      defaults: perm
    });
  }

  // Create default roles
  const userRole = await Role.findOrCreate({
    where: { name: 'user' },
    defaults: {
      name: 'user',
      description: 'Regular user with basic access',
      permissions: ['view_own_profile', 'update_own_profile', 'create_job', 'view_own_jobs', 'delete_own_jobs']
    }
  });

  const adminRole = await Role.findOrCreate({
    where: { name: 'admin' },
    defaults: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: ['view_own_profile', 'update_own_profile', 'create_job', 'view_own_jobs', 'delete_own_jobs', 'view_all_users', 'manage_users', 'view_all_jobs', 'manage_jobs', 'view_admin_stats', 'manage_system']
    }
  });

  // Assign permissions to roles
  const userPermissions = await Permission.findAll({
    where: { name: ['view_own_profile', 'update_own_profile', 'create_job', 'view_own_jobs', 'delete_own_jobs'] }
  });

  const adminPermissions = await Permission.findAll({
    where: { name: ['view_own_profile', 'update_own_profile', 'create_job', 'view_own_jobs', 'delete_own_jobs', 'view_all_users', 'manage_users', 'view_all_jobs', 'manage_jobs', 'view_admin_stats', 'manage_system'] }
  });

  await userRole[0].setPermissions(userPermissions);
  await adminRole[0].setPermissions(adminPermissions);

  console.log('Roles and permissions initialized');
};

export default sequelize;
