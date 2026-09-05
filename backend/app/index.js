import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Config & Middleware
import { connectDB } from './config/db.js';
import errorHandler from './middlewares/error.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.route.js';
import translationRoutes from './routes/translation.route.js';
import dictionaryRoutes from './routes/dictionary.route.js';
import gameRoutes from './routes/game.route.js';
import sessionRoutes from './routes/session.route.js';
import progressRoutes from './routes/progress.route.js';
import securityRouter from './routes/security.route.js';
import datasetRoutes from './routes/dataset.route.js';
import wikiRoutes from './routes/wiki.route.js';
import notificationRoutes from './routes/notification.route.js';
import activityRoutes from './routes/activity.route.js';
import adminRoutes from './routes/admin.route.js';

const app = express();
// Trust the first proxy (e.g. Render, Heroku) so rate limiter can get the real client IP
app.set('trust proxy', 1);
const port = process.env.PORT || 5001;

// ─── Core Middleware ─────────────────────────────────────────────────────────

app.use(helmet());

app.use(cors({
  origin: '*', // Allow all origins for Expo Go development
}));

// Body parsers — MUST be before routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────

// Rate limit ONLY the login endpoint — not internal admin API polling
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts. Try again later.' },
}));

app.use('/api/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/translations', translationRoutes);
app.use('/api/dictionary', dictionaryRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/dataset', datasetRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api', securityRouter);
app.use('/api/admin', adminRoutes);

// ─── Error Handler (MUST be last) ────────────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

const startServer = async () => {
  await connectDB();
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📱 For Expo Go, use: http://YOUR_IP_ADDRESS:${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;