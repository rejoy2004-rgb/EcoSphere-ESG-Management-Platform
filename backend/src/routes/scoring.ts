import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/recalculate', authenticateJWT, async (req, res) => {
  res.json({ message: 'Recalculation placeholder triggered successfully' });
});

export default router;
