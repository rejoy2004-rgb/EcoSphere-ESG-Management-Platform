import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-38c21a4e';

router.post('/register', async (req, res) => {
  const { name, email, password, role, departmentId } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        role: role || 'EMPLOYEE',
        departmentId: departmentId || null
      }
    });
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        departmentId: newUser.departmentId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        pointsBalance: newUser.pointsBalance
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true }
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        pointsBalance: user.pointsBalance
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const profile = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: true }
    });
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      department: profile.department,
      pointsBalance: profile.pointsBalance
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
