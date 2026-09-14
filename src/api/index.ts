import { Router } from 'express';
import wifiRoutes from './wifi.routes.ts';
import adminRoutes from './admin.routes.ts';
import radiusRoutes from './radius.routes.ts';
import { DbClient } from '../db/db.ts';

const router = Router();

router.use('/wifi', wifiRoutes);
router.use('/admin', adminRoutes);
router.use('/radius', radiusRoutes);

// Public settings
router.get('/settings', async (req, res) => {
  const settings = await DbClient.getSettings();
  res.json(settings);
});

// Healthcheck
router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

export default router;
