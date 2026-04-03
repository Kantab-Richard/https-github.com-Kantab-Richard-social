import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import process from 'node:process';
import { User, Role } from '../models';

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name });

    // Assign default user role
    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (defaultRole) {
      await user.setRole(defaultRole);
    }

    const token = jwt.sign(
      { id: user.get('id'), email: user.get('email'), role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.get('id'),
        email: user.get('email'),
        name: user.get('name'),
        role: 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, attributes: ['name'] }]
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.get('password'));
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Get role name from the associated role
    const userRole = user.Role?.name || 'user';

    const token = jwt.sign(
      { id: user.get('id'), email: user.get('email'), role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.get('id'),
        email: user.get('email'),
        name: user.get('name'),
        role: userRole
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const me = async (req, res) => {
  // This would use the authenticate middleware
  res.json({ user: req.user });
};
