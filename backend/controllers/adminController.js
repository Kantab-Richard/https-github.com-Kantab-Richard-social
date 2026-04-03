import { User, Job, Role, Permission } from '../models';
import sequelize from '../models';
import os from 'node:os';

export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalJobs = await Job.count();
    const activeJobs = await Job.count({ where: { status: 'processing' } });
    const failedJobs = await Job.count({ where: { status: 'failed' } });
    const totalDownloads = await Job.count({ where: { status: 'completed' } });

    // Calculate real system stats
    const cpus = os.cpus().length;
    const cpuLoad = (os.loadavg()[0] / cpus) * 100;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    res.json({
      totalUsers,
      totalDownloads,
      totalJobs,
      activeJobs,
      failedJobs,
      usedStorage: 'Unknown', 
      totalStorage: 'Unlimited',
      serverUptime: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
      cpuUsage: Math.min(Math.round(cpuLoad), 100),
      memoryUsage: memUsage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'status', 'createdAt'],
      include: [
        { model: Job, attributes: ['id'] },
        { model: Role, attributes: ['name'] }
      ]
    });
    
    const formattedUsers = users.map((u) => ({
      ...u.toJSON(),
      downloadsCount: u.Jobs?.length || 0,
      role: u.Role?.name || 'user'
    }));

    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlatformStats = async (req, res) => {
  try {
    const stats = await Job.findAll({
      attributes: [
        'platform',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['platform']
    });

    const platformData = {
      youtube: 0,
      tiktok: 0,
      instagram: 0,
      facebook: 0,
      twitter: 0,
      other: 0
    };

    stats.forEach((s) => {
      const platform = (s.get('platform') || 'other').toLowerCase();
      const count = parseInt(s.get('count') || '0', 10);
      
      if (platform in platformData) {
        platformData[platform] = count;
      } else {
        platformData.other += count;
      }
    });

    res.json(platformData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleUserAction = async (req, res) => {
  const { userId, action } = req.params;
  try {
    // Ensure userId is a string
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    const targetUser = await User.findByPk(userIdStr);
    
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (action === 'ban') {
      await targetUser.update({ status: 'banned' });
    } else if (action === 'unban') {
      await targetUser.update({ status: 'active' });
    } else if (action === 'delete') {
      await targetUser.destroy();
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    res.json({ success: true, message: `User ${action} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleJobAction = async (req, res) => {
  const { jobId, action } = req.params;
  try {
    const jobIdStr = Array.isArray(jobId) ? jobId[0] : jobId;
    const targetJob = await Job.findByPk(jobIdStr);
    
    if (!targetJob) return res.status(404).json({ error: "Job not found" });

    if (action === 'retry') {
      // Reset job to pending so the worker can pick it up again
      await targetJob.update({ status: 'pending', error: null, step: 'Queued' });
    } else if (action === 'cancel') {
      await targetJob.update({ status: 'failed', error: 'Cancelled by administrator' });
    } else if (action === 'delete') {
      await targetJob.destroy();
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    res.json({ success: true, message: `Job ${action} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Role and Permission Management
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [Permission]
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRolePermissions = async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body; // Array of permission names

  try {
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const permissionInstances = await Permission.findAll({
      where: { name: permissions }
    });

    await role.setPermissions(permissionInstances);
    await role.update({ permissions }); // Sync JSON cache field

    const updatedRole = await Role.findByPk(roleId, {
      include: [Permission]
    });

    res.json(updatedRole);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRole = async (req, res) => {
  const { name, description, permissions } = req.body;
  try {
    const role = await Role.create({ name, description });

    if (permissions && permissions.length > 0) {
      const permissionInstances = await Permission.findAll({
        where: { name: permissions }
      });
      await role.setPermissions(permissionInstances);
    }

    const roleWithPermissions = await Role.findByPk(role.get('id'), {
      include: [Permission]
    });

    res.status(201).json(roleWithPermissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const assignRoleToUser = async (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  try {
    // Ensure userId is a string
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    const roleIdStr = Array.isArray(roleId) ? roleId[0] : roleId;

    const user = await User.findByPk(userIdStr);
    const role = await Role.findByPk(roleIdStr);

    if (!user || !role) {
      return res.status(404).json({ error: 'User or role not found' });
    }

    await user.setRole(role);
    res.json({ success: true, message: 'Role assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPermission = async (req, res) => {
  const { name, resource, action, description } = req.body;
  try {
    const permission = await Permission.create({ name, resource, action, description });
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};