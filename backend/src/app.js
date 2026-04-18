import express from 'express';
import cors from 'cors';
import advisorRoutes from './routes/advisorRoute.js';
import devRoutes from './routes/devRoute.js';
import authRoutes from './routes/authRoute.js';
import { seedPortalConfig } from './models/PortalConfig.js';

const app = express();

app.use(cors());
app.use(express.json());

// Seed portal config on startup (only runs once if empty)
seedPortalConfig().catch(err => console.error('Seed error:', err));

// Routes
app.get('/api/test', (req, res) => { res.send('CORS is working!'); });
app.use('/api/auth', authRoutes);
app.use('/api/advisors', advisorRoutes);
app.use('/api/dev', devRoutes);

app.get('/', (req, res) => { res.send('API is running...'); });

export default app;
