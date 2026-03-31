import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name });

    const token = jwt.sign({ id: user.get('id'), email: user.get('email') }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.get('id'), email: user.get('email'), name: user.get('name') } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.get('password') as string);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.get('id'), email: user.get('email') }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.get('id'), email: user.get('email'), name: user.get('name') } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const me = async (req: any, res: Response) => {
  // This would use the authenticate middleware
  res.json({ user: req.user });
};
