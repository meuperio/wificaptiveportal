import { Router } from 'express';
import { DbClient } from '../db/db.ts';

const router = Router();

// Endpoint for receiving RADIUS accounting webhooks
router.post('/accounting', async (req, res) => {
  try {
    const { 
      radiusSessionId, 
      statusType, // Start, Stop, Interim-Update
      inputOctets,
      outputOctets,
      sessionTime
    } = req.body;

    if (!radiusSessionId) {
      return res.status(400).json({ error: 'radiusSessionId is required' });
    }

    const updates: any = {};
    if (inputOctets) updates.input_octets = inputOctets;
    if (outputOctets) updates.output_octets = outputOctets;
    if (sessionTime) updates.session_time = sessionTime;
    
    if (statusType === 'Stop') {
      updates.session_status = 'DISCONNECTED';
      updates.ended_at = new Date().toISOString();
    } else if (statusType === 'Start') {
      updates.session_status = 'ACTIVE';
    }

    if (Object.keys(updates).length > 0) {
      await DbClient.updateSessionAccounting(radiusSessionId, updates);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Accounting Webhook Error', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
