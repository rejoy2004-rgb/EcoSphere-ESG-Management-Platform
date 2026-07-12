import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { isValidTransition } from '../utils/transitions';
import { evaluateBadgesForEmployee } from '../services/gamification';
import { sendNotification } from '../services/notificationService';

const prisma = new PrismaClient();
const router = Router();

router.post('/challenges', authenticateJWT, requireRole(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
  const { title, categoryId, description, xp, difficulty, evidenceRequired, deadline } = req.body;
  if (!title || !categoryId || !xp || !difficulty || !deadline) {
    return res.status(400).json({ error: 'Title, categoryId, xp, difficulty, and deadline are required' });
  }
  try {
    const challenge = await prisma.challenge.create({
      data: {
        title,
        categoryId,
        description: description || null,
        xp: parseInt(xp),
        difficulty,
        evidenceRequired: evidenceRequired === true || evidenceRequired === 'true',
        deadline: new Date(deadline),
        status: 'DRAFT'
      }
    });
    res.status(201).json(challenge);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/challenges', authenticateJWT, async (req, res) => {
  try {
    const list = await prisma.challenge.findMany({
      include: { category: true }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/challenges/:id', authenticateJWT, async (req, res) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        participations: {
          include: { employee: true }
        }
      }
    });
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/challenges/:id', authenticateJWT, requireRole(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
  const { title, categoryId, description, xp, difficulty, evidenceRequired, deadline } = req.body;
  try {
    const existing = await prisma.challenge.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    const updated = await prisma.challenge.update({
      where: { id: req.params.id },
      data: {
        title: title !== undefined ? title : existing.title,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        description: description !== undefined ? description : existing.description,
        xp: xp !== undefined ? parseInt(xp) : existing.xp,
        difficulty: difficulty !== undefined ? difficulty : existing.difficulty,
        evidenceRequired: evidenceRequired !== undefined ? (evidenceRequired === true || evidenceRequired === 'true') : existing.evidenceRequired,
        deadline: deadline !== undefined ? new Date(deadline) : existing.deadline
      }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/challenges/:id', authenticateJWT, requireRole(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
  try {
    await prisma.challenge.delete({ where: { id: req.params.id } });
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/challenges/:id/status', authenticateJWT, requireRole(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  try {
    const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    if (!isValidTransition(challenge.status, status)) {
      return res.status(400).json({ error: `Invalid status transition from ${challenge.status} to ${status}` });
    }
    const updated = await prisma.challenge.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/challenges/:id/join', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    const existing = await prisma.challengeParticipation.findFirst({
      where: {
        challengeId: req.params.id,
        employeeId: req.user.id
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'Already joined this challenge' });
    }
    const participation = await prisma.challengeParticipation.create({
      data: {
        challengeId: req.params.id,
        employeeId: req.user.id,
        progress: 0,
        approval: 'PENDING'
      }
    });
    res.status(201).json(participation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/participation/challenge/:id/progress', authenticateJWT, upload.single('proof'), async (req, res) => {
  const { progress } = req.body;
  try {
    const participation = await prisma.challengeParticipation.findUnique({ where: { id: req.params.id } });
    if (!participation) {
      return res.status(404).json({ error: 'Challenge participation record not found' });
    }
    const proofUrl = req.file ? `/uploads/${req.file.filename}` : participation.proofUrl;
    const updated = await prisma.challengeParticipation.update({
      where: { id: req.params.id },
      data: {
        progress: progress !== undefined ? parseInt(progress) : participation.progress,
        proofUrl
      }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/participation/challenge/:id/approve', authenticateJWT, requireRole(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
  try {
    const participation = await prisma.challengeParticipation.findUnique({
      where: { id: req.params.id },
      include: { challenge: true }
    });
    if (!participation) {
      return res.status(404).json({ error: 'Challenge participation record not found' });
    }
    const settings = await prisma.systemSetting.findFirst();
    const globalReq = settings ? settings.evidenceRequirementEnabled : false;
    if ((participation.challenge.evidenceRequired || globalReq) && !participation.proofUrl) {
      return res.status(400).json({ error: 'Proof file is required for this challenge' });
    }
    const xp = participation.challenge.xp;
    const [updated] = await prisma.$transaction([
      prisma.challengeParticipation.update({
        where: { id: req.params.id },
        data: {
          approval: 'APPROVED',
          xpAwarded: xp
        }
      }),
      prisma.pointsLedgerEntry.create({
        data: {
          employeeId: participation.employeeId,
          delta: xp,
          reason: 'CHALLENGE_APPROVAL',
          referenceId: participation.id
        }
      }),
      prisma.user.update({
        where: { id: participation.employeeId },
        data: {
          pointsBalance: {
            increment: xp
          }
        }
      })
    ]);
    await evaluateBadgesForEmployee(participation.employeeId);
    await sendNotification(
      participation.employeeId,
      'CHALLENGE_APPROVED',
      `Your participation in Challenge "${participation.challenge.title}" was approved.`
    );
    res.json({
      message: 'Challenge participation approved and XP awarded',
      participation: updated
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/participation/challenge/:id/reject', authenticateJWT, requireRole(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
  try {
    const participation = await prisma.challengeParticipation.findUnique({
      where: { id: req.params.id },
      include: { challenge: true }
    });
    if (!participation) {
      return res.status(404).json({ error: 'Challenge participation record not found' });
    }
    const updated = await prisma.challengeParticipation.update({
      where: { id: req.params.id },
      data: {
        approval: 'REJECTED'
      }
    });
    await sendNotification(
      participation.employeeId,
      'CHALLENGE_REJECTED',
      `Your participation in Challenge "${participation.challenge.title}" was rejected.`
    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
