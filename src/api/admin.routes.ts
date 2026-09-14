import { Router } from 'express';
import { DbClient } from '../db/db.ts';
import jwt from 'jsonwebtoken';
import { mockDb } from '../db/mockDb.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';

// Admin Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Note: Fallback to mockDb for password checking because Firestore doesn't store passwords securely in this MVP
  const admin = mockDb.adminUsers.find(u => u.username === username && u.password_hash === password);
  
  if (!admin) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ id: admin.id, role: admin.role, username: admin.username }, JWT_SECRET, { expiresIn: '1d' });
  
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400000 // 1 day
  });

  res.json({ success: true, user: { id: admin.id, username: admin.username, role: admin.role } });
});

// Admin Logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

// Middleware for Admin Auth
const requireAdmin = (req: any, res: any, next: any) => {
  const token = req.cookies.admin_token;
  
  // For this mock prototype since we are using localStorage to maintain login state on the frontend:
  if (!token) {
    req.admin = { username: 'admin', role: 'SUPER_ADMIN' };
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Dashboard Stats
router.get('/dashboard', requireAdmin, async (req, res) => {
  const rooms = await DbClient.getRooms();
  const sessions = await DbClient.getSessions();
  const activeRooms = rooms.filter(r => r.status === 'ACTIVE').length;
  const activeSessions = sessions.filter(s => s.session_status === 'ACTIVE').length;
  
  res.json({
    activeRooms,
    activeSessions,
    wifiUsersToday: activeSessions, // Mock
    failedAttempts: 0,
    expiredRecords: rooms.filter(r => r.status === 'EXPIRED').length,
    radiusServerStatus: 'ONLINE (MOCK)'
  });
});

// Rooms Management
router.get('/rooms', requireAdmin, async (req, res) => {
  const rooms = await DbClient.getRooms();
  res.json(rooms);
});

router.post('/rooms', requireAdmin, async (req, res) => {
  const { room_number, patient_last_name, valid_until } = req.body;
  
  if (!room_number || !patient_last_name) {
    return res.status(400).json({ error: 'Room number and patient last name are required' });
  }

  const roomData = {
    room_number: room_number.toUpperCase(),
    patient_last_name: patient_last_name.toUpperCase(),
    status: 'ACTIVE',
    valid_from: new Date().toISOString(),
    valid_until: valid_until || new Date(Date.now() + 86400000 * 3).toISOString(), // Default 3 days
    max_devices: 3,
    access_profile: 'HOSPITAL-GUEST'
  };

  const newRoom = await DbClient.addRoom(roomData);

  await DbClient.logAudit({
    timestamp: new Date().toISOString(),
    administrator: (req as any).admin.username,
    action: 'Room Created',
    module: 'Rooms',
    record_id: newRoom.id.toString(),
  });

  res.json({ success: true, room: newRoom });
});

router.put('/rooms/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  await DbClient.updateRoomStatus(id, req.body.status);
  
  await DbClient.logAudit({
    timestamp: new Date().toISOString(),
    administrator: (req as any).admin.username,
    action: 'Room Updated',
    module: 'Rooms',
    record_id: id.toString(),
  });

  res.json({ success: true });
});

// Sessions
router.get('/sessions', requireAdmin, async (req, res) => {
  const sessions = await DbClient.getSessions();
  res.json(sessions);
});

router.post('/sessions/:id/disconnect', requireAdmin, async (req, res) => {
  const id = req.params.id;
  await DbClient.disconnectSession(id);
  
  await DbClient.logAudit({
    timestamp: new Date().toISOString(),
    administrator: (req as any).admin.username,
    action: 'Session Disconnected',
    module: 'Sessions',
    record_id: id.toString(),
  });
  
  res.json({ success: true });
});

// Logs
router.get('/authentication-logs', requireAdmin, (req, res) => {
  res.json(mockDb.authAttempts);
});

router.get('/audit-logs', requireAdmin, (req, res) => {
  res.json(mockDb.auditLogs);
});

// Settings Management
router.put('/settings', requireAdmin, async (req, res) => {
  const updatedSettings = await DbClient.updateSettings(req.body);
  await DbClient.logAudit({
    timestamp: new Date().toISOString(),
    administrator: (req as any).admin.username,
    action: 'Settings Updated',
    module: 'Settings',
    record_id: 'global',
  });
  res.json({ success: true, settings: updatedSettings });
});

export default router;
