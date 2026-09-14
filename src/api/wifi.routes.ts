import { Router } from 'express';
import { getRadiusProvider } from '../services/radius/index.ts';
import { DbClient } from '../db/db.ts';
import { randomBytes } from 'crypto';

const router = Router();
const radius = getRadiusProvider();

router.post('/validate', async (req, res) => {
  try {
    const { roomNumber, patientLastName, networkData } = req.body;

    if (!roomNumber || !patientLastName) {
      return res.status(400).json({ error: 'Room number and patient last name are required' });
    }

    const room = String(roomNumber).trim().toUpperCase();
    const lastName = String(patientLastName).trim().toUpperCase();

    // Rate Limiting (WIFI-003)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const attempts = await DbClient.getAuthAttemptsByRoom(room);
    
    // Count failures in the last 10 minutes
    const recentFailures = attempts.filter((a: any) => 
      a.result !== 'SUCCESS' && 
      new Date(a.created_at) > tenMinutesAgo
    );

    if (recentFailures.length >= 5) {
      return res.status(429).json({ error: 'Too many failed attempts. Please wait 10 minutes before trying again or contact hospital staff.' });
    }

    // Search active room/patient records
    const record = await DbClient.getRoom(room, lastName);

    if (!record) {
      // Record failure
      await DbClient.logAuthAttempt({
        room_number: room,
        result: 'INVALID_CREDENTIALS',
        created_at: new Date().toISOString()
      });
      return res.status(401).json({ error: 'We could not validate the information provided. Please verify the room number and patient last name.' });
    }

    if (record.status !== 'ACTIVE') {
      await DbClient.logAuthAttempt({
        room_number: room,
        result: 'EXPIRED',
        failure_reason: `Status is ${record.status}`,
        created_at: new Date().toISOString()
      });
      return res.status(401).json({ error: 'We could not validate the information provided. Please verify the room number and patient last name.' });
    }

    const now = new Date();
    if (new Date(record.valid_from) > now || new Date(record.valid_until) < now) { 
       await DbClient.logAuthAttempt({
        room_number: room,
        result: 'EXPIRED',
        failure_reason: 'Outside validity period',
        created_at: new Date().toISOString()
      });
      return res.status(401).json({ error: 'We could not validate the information provided. Please verify the room number and patient last name.' });
    }

    // Check Session Policy (WIFI-004)
    const activeSessions = await DbClient.getActiveSessionsByRoom(String(record.id));
    if (activeSessions.length >= (record.max_devices || 3)) {
      await DbClient.logAuthAttempt({
        room_number: room,
        result: 'POLICY_REJECT',
        failure_reason: `Max devices (${record.max_devices || 3}) reached`,
        created_at: new Date().toISOString()
      });
      return res.status(403).json({ error: 'Device limit reached for this room. Disconnect another device before connecting.' });
    }

    // Success! Generate temporary identity
    const tempIdentity = `guest_${room}_${randomBytes(3).toString('hex').toUpperCase()}`;

    // Call RADIUS integration
    const radiusRes = await radius.authenticate({
      username: tempIdentity,
      clientMac: networkData?.client_mac,
      apMac: networkData?.ap_mac,
      ssid: networkData?.ssid
    });

    if (!radiusRes.success) {
      await DbClient.logAuthAttempt({
        room_number: room,
        result: 'RADIUS_FAILURE',
        created_at: new Date().toISOString()
      });
      return res.status(500).json({ error: 'Internal system error during authorization.' });
    }

    // Create session
    const session = {
      room_id: String(record.id),
      network_username: tempIdentity,
      radius_session_id: radiusRes.radiusSessionId,
      client_mac: networkData?.client_mac || 'UNKNOWN',
      ap_mac: networkData?.ap_mac || 'UNKNOWN',
      started_at: new Date().toISOString(),
      session_status: 'ACTIVE'
    };
    await DbClient.createWifiSession(session);

    // Record success
    await DbClient.logAuthAttempt({
      room_number: room,
      result: 'SUCCESS',
      created_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Wi-Fi Access Granted',
      identity: tempIdentity,
      redirect: '/wifi/success'
    });
  } catch (err: any) {
    console.error('Validation Error', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
