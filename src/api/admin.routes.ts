import { Router } from 'express';
import { DbClient } from '../db/db.ts';
import jwt from 'jsonwebtoken';
import { mockDb } from '../db/mockDb.ts';
import { getRadiusProvider } from '../services/radius/index.ts';
import { Parser } from 'json2csv';
import bcrypt from 'bcryptjs';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';
const radius = getRadiusProvider();

// Helper for patient surname masking
const maskSurname = (surname: string) => {
  if (!surname) return '';
  if (surname.length <= 2) return surname;
  return surname[0] + '*'.repeat(surname.length - 2) + surname[surname.length - 1];
};

const needsMasking = (role: string) => ['VIEWER', 'IT_ADMIN'].includes(role);

// Admin Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const admin = await DbClient.getAdmin(username);
  
  if (!admin) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Use bcrypt to compare passwords
  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
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

// Admin change own password
router.put('/my-password', requireAdmin, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old password and new password are required' });
  }

  const admin = await DbClient.getAdminById((req as any).admin.id);
  if (!admin) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isMatch = await bcrypt.compare(oldPassword, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect old password' });
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(newPassword, salt);
  
  await DbClient.updateAdmin(admin.id, { password_hash });
  
  await DbClient.logAudit({
    timestamp: new Date().toISOString(),
    administrator: admin.username,
    action: `Password Changed`,
    module: 'Users',
    record_id: String(admin.id),
  });

  res.json({ success: true });
});

// Middleware for Admin Auth
const requireAdmin = (req: any, res: any, next: any) => {
  const token = req.cookies.admin_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.admin || !req.admin.role) {
      return res.status(403).json({ error: 'Role not found' });
    }
    if (!allowedRoles.includes(req.admin.role) && req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

// Dashboard Stats (All roles can view dashboard)
router.get('/dashboard', requireAdmin, async (req, res) => {
  const rooms = await DbClient.getRooms();
  const sessions = await DbClient.getSessions();
  const authLogs = await DbClient.getAllAuthAttempts();
  
  const activeRooms = rooms.filter(r => r.status === 'ACTIVE').length;
  const activeSessions = sessions.filter(s => s.session_status === 'ACTIVE').length;
  
  const failedAttempts = authLogs.filter((a: any) => a.result !== 'SUCCESS').length;
  
  // Calculate real daily users (unique client MACs connected today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessions = sessions.filter(s => new Date(s.started_at) >= today);
  const uniqueUsersToday = new Set(todaySessions.map(s => s.client_mac || s.network_username)).size;

  // Real RADIUS status
  const radiusStatus = await radius.getStatus();

  res.json({
    activeRooms,
    activeSessions,
    wifiUsersToday: uniqueUsersToday,
    failedAttempts,
    expiredRecords: rooms.filter(r => r.status === 'EXPIRED').length,
    radiusServerStatus: radiusStatus
  });
});

// Rooms Management
router.get('/rooms', requireAdmin, requireRole(['IT_ADMIN', 'FRONT_DESK', 'VIEWER']), async (req, res) => {
  const rooms = await DbClient.getRooms();
  
  if (needsMasking((req as any).admin.role)) {
    const maskedRooms = rooms.map(r => ({
      ...r,
      patient_last_name: maskSurname(r.patient_last_name)
    }));
    return res.json(maskedRooms);
  }
  
  res.json(rooms); 
});

router.post('/rooms', requireAdmin, requireRole(['IT_ADMIN', 'FRONT_DESK']), async (req, res) => {
  const { room_number, patient_last_name, valid_until, access_profile } = req.body;
  
  if (!room_number || !patient_last_name) {
    return res.status(400).json({ error: 'Room number and patient last name are required' });
  }

  const roomData = {
    room_number: room_number.toUpperCase(),
    patient_last_name: patient_last_name.toUpperCase(),
    status: 'ACTIVE',
    valid_from: new Date().toISOString(),
    valid_until: valid_until || new Date(Date.now() + 86400000 * 3).toISOString(),
    max_devices: 3,
    access_profile: access_profile || 'STANDARD'
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

router.put('/rooms/:id', requireAdmin, requireRole(['IT_ADMIN', 'FRONT_DESK']), async (req, res) => {
  const id = req.params.id;
  const { status: newStatus, room_number, patient_last_name, valid_until, access_profile } = req.body;
  
  if (newStatus) {
    await DbClient.updateRoomStatus(id, newStatus);
  }

  // Update other details if provided
  const room = await DbClient.getRoomByNumber(room_number) || mockDb.rooms.find(r => String(r.id) === id);
  if (room) {
    if (room_number) room.room_number = room_number;
    if (patient_last_name) room.patient_last_name = patient_last_name;
    if (valid_until) room.valid_until = valid_until;
    if (access_profile) room.access_profile = access_profile;
    if (newStatus) room.status = newStatus;
  }
  
  if (newStatus === 'DISCHARGED' || newStatus === 'EXPIRED') {
    const activeSessions = await DbClient.getActiveSessionsByRoom(id);
    for (const session of activeSessions) {
      if (session.network_username && session.radius_session_id) {
        await radius.disconnect({
          username: session.network_username,
          radiusSessionId: session.radius_session_id
        });
      }
      await DbClient.disconnectSession(String(session.id));
    }
  }

  await DbClient.logAudit({
    timestamp: new Date().toISOString(),
    administrator: (req as any).admin.username,
    action: `Room ${id} Updated`,
    module: 'Rooms',
    record_id: id.toString(),
  });

  res.json({ success: true });
});

// Sessions
router.get('/sessions', requireAdmin, requireRole(['IT_ADMIN', 'FRONT_DESK', 'VIEWER']), async (req, res) => {
  const sessions = await DbClient.getSessions();
  
  if (needsMasking((req as any).admin.role)) {
    const mapped = sessions.map(s => ({
      ...s,
      patient_last_name: maskSurname(s.patient_last_name)
    }));
    return res.json(mapped);
  }
  
  res.json(sessions);
});

router.post('/sessions/:id/disconnect', requireAdmin, requireRole(['IT_ADMIN']), async (req, res) => {
  const id = req.params.id;
  
  const session = await DbClient.getSession(id);
  if (session && session.network_username && session.radius_session_id) {
    await radius.disconnect({
      username: session.network_username,
      radiusSessionId: session.radius_session_id
    });
  }

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

router.post('/sessions/:id/block', requireAdmin, requireRole(['IT_ADMIN']), async (req, res) => {
  const id = req.params.id;
  
  const session = await DbClient.getSession(id);
  if (session && session.client_mac) {
    // 1. Disconnect them from RADIUS
    if (session.network_username && session.radius_session_id) {
      await radius.disconnect({
        username: session.network_username,
        radiusSessionId: session.radius_session_id
      });
    }

    // 2. Disconnect session locally
    await DbClient.disconnectSession(id);
    
    // 3. Add to blocklist
    await DbClient.blockDevice(session.client_mac, 'Blocked by IT Admin');
    
    await DbClient.logAudit({
      timestamp: new Date().toISOString(),
      administrator: (req as any).admin.username,
      action: `Device Blocked (${session.client_mac})`,
      module: 'Sessions',
      record_id: id.toString(),
    });
    
    return res.json({ success: true });
  }
  
  res.status(404).json({ error: 'Session or MAC address not found' });
});

// Logs
router.get('/authentication-logs', requireAdmin, requireRole(['IT_ADMIN', 'VIEWER']), async (req, res) => {
  const logs = await DbClient.getAllAuthAttempts();
  
  if (needsMasking((req as any).admin.role)) {
    const mapped = logs.map(l => ({ ...l, patient_last_name: maskSurname(l.patient_last_name) }));
    return res.json(mapped);
  }
  
  res.json(logs);
});

router.get('/audit-logs', requireAdmin, requireRole([]), async (req, res) => { // SUPER_ADMIN only
  const logs = await DbClient.getAllAuditLogs();
  const mapped = logs.map(l => ({ ...l, action: maskSurnameInAction(l.action) }));
  res.json(mapped);
});

// Settings Management
router.put('/settings', requireAdmin, requireRole([]), async (req, res) => { // SUPER_ADMIN only
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

router.post('/settings/test-radius', requireAdmin, requireRole([]), async (req, res) => {
  try {
    const status = await radius.getStatus();
    if (status === 'ONLINE' || status === 'MOCK') {
      res.json({ success: true, message: `Connected successfully (${status})` });
    } else {
      res.status(500).json({ success: false, message: 'Server is OFFLINE or unreachable' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Connection timed out or failed' });
  }
});

// Reports (CSV Exports)
router.get('/reports/sessions/csv', requireAdmin, requireRole(['IT_ADMIN', 'VIEWER', 'FRONT_DESK']), async (req, res) => {
  const sessions = await DbClient.getSessions();
  const data = needsMasking((req as any).admin.role) 
    ? sessions.map(s => ({ ...s, patient_last_name: maskSurname(s.patient_last_name) }))
    : sessions;
    
  try {
    const parser = new Parser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('sessions_report.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/reports/authentication-logs/csv', requireAdmin, requireRole(['IT_ADMIN', 'VIEWER']), async (req, res) => {
  const logs = await DbClient.getAllAuthAttempts();
  const data = needsMasking((req as any).admin.role)
    ? logs.map(l => ({ ...l, patient_last_name: maskSurname(l.patient_last_name) }))
    : logs;
    
  try {
    const parser = new Parser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('auth_logs_report.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/reports/audit-logs/csv', requireAdmin, requireRole([]), async (req, res) => {
  const logs = await DbClient.getAllAuditLogs();
  const mapped = logs.map(l => ({ ...l, action: maskSurnameInAction(l.action) }));
  try {
    const parser = new Parser();
    const csv = parser.parse(mapped);
    res.header('Content-Type', 'text/csv');
    res.attachment('audit_logs_report.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

function maskSurnameInAction(action: string) {
  // Simplistic masking if needed for audit logs
  return action; 
}

// User Management (Admin Accounts)
router.get('/users', requireAdmin, requireRole([]), async (req, res) => {
  const admins = await DbClient.getAdmins();
  const users = admins.map(u => ({ id: u.id, username: u.username, role: u.role }));
  res.json(users);
});

router.post('/users', requireAdmin, requireRole([]), async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }
  
  const exists = await DbClient.getAdmin(username);
  if (exists) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  
  const newUser = await DbClient.addAdmin({
    username,
    password_hash,
    role
  });
  
  await DbClient.logAudit({
    timestamp: new Date().toISOString(),
    administrator: (req as any).admin.username,
    action: `Admin User Created (${username})`,
    module: 'Users',
    record_id: newUser.id.toString(),
  });

  res.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

router.put('/users/:id', requireAdmin, requireRole([]), async (req, res) => {
  const id = req.params.id;
  const { username, password, role } = req.body;
  
  const user = await DbClient.getAdminById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const updates: any = {};
  if (username) updates.username = username;
  if (role) updates.role = role;
  
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updates.password_hash = await bcrypt.hash(password, salt);
  }
  
  await DbClient.updateAdmin(id, updates);
  
  await DbClient.logAudit({
    timestamp: new Date().toISOString(),
    administrator: (req as any).admin.username,
    action: `Admin User Updated (${updates.username || user.username})`,
    module: 'Users',
    record_id: id.toString(),
  });

  res.json({ success: true });
});

router.delete('/users/:id', requireAdmin, requireRole([]), async (req, res) => {
  const id = req.params.id;
  const user = await DbClient.getAdminById(id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (user.role === 'SUPER_ADMIN') {
    const admins = await DbClient.getAdmins();
    const superAdmins = admins.filter(u => u.role === 'SUPER_ADMIN');
    if (superAdmins.length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last Super Admin' });
    }
  }

  await DbClient.deleteAdmin(id);
  
  await DbClient.logAudit({
    timestamp: new Date().toISOString(),
    administrator: (req as any).admin.username,
    action: `Admin User Deleted (${user.username})`,
    module: 'Users',
    record_id: id.toString(),
  });

  res.json({ success: true });
});

export default router;
