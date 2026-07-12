import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.post('/', authenticateJWT, async (req, res) => {
  const { employeeId, trainingName, completedAt, status } = req.body;
  if (!employeeId || !trainingName) {
    return res.status(400).json({ error: 'EmployeeId and trainingName are required' });
  }
  try {
    const record = await prisma.trainingRecord.create({
      data: {
        employeeId,
        trainingName,
        completedAt: completedAt ? new Date(completedAt) : null,
        status: status || 'ASSIGNED'
      }
    });
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticateJWT, async (req, res) => {
  try {
    const list = await prisma.trainingRecord.findMany({
      include: { employee: true }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const record = await prisma.trainingRecord.findUnique({
      where: { id: req.params.id },
      include: { employee: true }
    });
    if (!record) {
      return res.status(404).json({ error: 'Training record not found' });
    }
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticateJWT, async (req, res) => {
  const { employeeId, trainingName, completedAt, status } = req.body;
  try {
    const existing = await prisma.trainingRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Training record not found' });
    }
    const updated = await prisma.trainingRecord.update({
      where: { id: req.params.id },
      data: {
        employeeId: employeeId !== undefined ? employeeId : existing.employeeId,
        trainingName: trainingName !== undefined ? trainingName : existing.trainingName,
        completedAt: completedAt !== undefined ? (completedAt ? new Date(completedAt) : null) : existing.completedAt,
        status: status !== undefined ? status : existing.status
      }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    await prisma.trainingRecord.delete({ where: { id: req.params.id } });
    res.json({ message: 'Training record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
