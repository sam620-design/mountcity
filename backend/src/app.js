import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import advisorRoutes from './routes/advisorRoute.js';
import devRoutes from './routes/devRoute.js';
import authRoutes from './routes/authRoute.js';
import plotRoutes from './routes/plotRoute.js';
import { seedPortalConfig } from './models/PortalConfig.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Seed portal config on startup (only runs once if empty)
seedPortalConfig().catch(err => console.error('Seed error:', err));

// Rate limiting for auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

// Routes
app.get('/api/test', (req, res) => { res.send('CORS is working!'); });
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/advisors', advisorRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/plots', plotRoutes);

app.get('/', (req, res) => { res.send('API is running...'); });

export default app;
