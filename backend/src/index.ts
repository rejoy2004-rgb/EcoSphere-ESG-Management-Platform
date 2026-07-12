import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './routes/auth';
import socialRouter from './routes/social';
import trainingRouter from './routes/training';
import dashboardRouter from './routes/dashboard';
import challengesRouter from './routes/challenges';
import settingsRouter from './routes/settings';
import notificationsRouter from './routes/notifications';
import carbonRouter from './routes/carbon';
import scoringRouter from './routes/scoring';
import { startScheduler } from './jobs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRouter);
app.use('/api', socialRouter);
app.use('/api/training-records', trainingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', challengesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/carbon-transactions', carbonRouter);
app.use('/api/scoring', scoringRouter);

startScheduler();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'EcoSphere API is healthy'
  });
});

app.listen(PORT, () => {
  console.log(`[EcoSphere Backend] Running on http://localhost:${PORT}`);
});
