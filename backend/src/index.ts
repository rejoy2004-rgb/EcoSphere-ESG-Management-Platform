import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './routes/auth';
import socialRouter from './routes/social';
import trainingRouter from './routes/training';
import dashboardRouter from './routes/dashboard';
import departmentsRouter from './routes/departments';
import categoriesRouter from './routes/categories';
import emissionFactorsRouter from './routes/emissionFactors';
import productESGProfilesRouter from './routes/productESGProfiles';
import environmentalGoalsRouter from './routes/environmentalGoals';
import esgPoliciesRouter from './routes/esgPolicies';
import badgesRouter from './routes/badges';
import rewardsRouter from './routes/rewards';
import carbonTransactionsRouter from './routes/carbonTransactions';
import acknowledgementsRouter from './routes/acknowledgements';
import meAcknowledgementsRouter from './routes/meAcknowledgements';
import auditsRouter from './routes/audits';
import complianceIssuesRouter from './routes/complianceIssues';
import { globalErrorHandler } from './utils/errors';

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
app.use('/api/departments', departmentsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/emission-factors', emissionFactorsRouter);
app.use('/api/product-esg-profiles', productESGProfilesRouter);
app.use('/api/environmental-goals', environmentalGoalsRouter);
app.use('/api/esg-policies', esgPoliciesRouter);
app.use('/api/policies', esgPoliciesRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/carbon-transactions', carbonTransactionsRouter);
app.use('/api/acknowledgements', acknowledgementsRouter);
app.use('/api/me/acknowledgements', meAcknowledgementsRouter);
app.use('/api/audits', auditsRouter);
app.use('/api/compliance-issues', complianceIssuesRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'EcoSphere API is healthy'
  });
});

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`[EcoSphere Backend] Running on http://localhost:${PORT}`);
});
