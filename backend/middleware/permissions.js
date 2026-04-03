import { User, Role, Permission } from '../models';

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          include: [Permission],
        }]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userRole = user.get('Role');
      if (userRole?.name === 'admin') {
        return next();
      }

      // Check role-based permissions
      // userRole is already defined
      if (!userRole) {
        return res.status(403).json({ error: 'No role assigned' });
      }

      const permissions = userRole.Permissions || [];
      const hasPermission = permissions.some((perm) => perm.name === requiredPermission);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

      const user = await User.findByPk(req.user.id, {
        include: [Role]
      });

      const userRole = user?.get('Role');
      if (!user || userRole?.name !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Admin check failed' });
  }
};

export const hasRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findByPk(req.user.id, {
        include: [Role]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userRole = user.get('Role');
      if (!userRole || userRole.name !== roleName) {
        return res.status(403).json({ error: `Role '${roleName}' required` });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Role check failed' });
    }
  };
};