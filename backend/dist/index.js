"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const departments_1 = __importDefault(require("./routes/departments"));
const categories_1 = __importDefault(require("./routes/categories"));
const emissionFactors_1 = __importDefault(require("./routes/emissionFactors"));
const productESGProfiles_1 = __importDefault(require("./routes/productESGProfiles"));
const environmentalGoals_1 = __importDefault(require("./routes/environmentalGoals"));
const esgPolicies_1 = __importDefault(require("./routes/esgPolicies"));
const badges_1 = __importDefault(require("./routes/badges"));
const rewards_1 = __importDefault(require("./routes/rewards"));
const errors_1 = require("./utils/errors");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'EcoSphere API is healthy'
    });
});
app.use('/api/departments', departments_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/emission-factors', emissionFactors_1.default);
app.use('/api/product-esg-profiles', productESGProfiles_1.default);
app.use('/api/environmental-goals', environmentalGoals_1.default);
app.use('/api/esg-policies', esgPolicies_1.default);
app.use('/api/badges', badges_1.default);
app.use('/api/rewards', rewards_1.default);
app.use(errors_1.globalErrorHandler);
app.listen(PORT, () => {
    console.log(`[EcoSphere Backend] Running on http://localhost:${PORT}`);
});
