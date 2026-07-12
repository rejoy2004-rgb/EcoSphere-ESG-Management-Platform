"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const social_1 = __importDefault(require("./routes/social"));
const training_1 = __importDefault(require("./routes/training"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const challenges_1 = __importDefault(require("./routes/challenges"));
const settings_1 = __importDefault(require("./routes/settings"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const carbon_1 = __importDefault(require("./routes/carbon"));
const scoring_1 = __importDefault(require("./routes/scoring"));
const jobs_1 = require("./jobs");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/auth', auth_1.default);
app.use('/api', social_1.default);
app.use('/api/training-records', training_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api', challenges_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/carbon-transactions', carbon_1.default);
app.use('/api/scoring', scoring_1.default);
(0, jobs_1.startScheduler)();
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
