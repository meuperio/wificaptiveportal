import { Router } from 'express';
import { DbClient } from '../db/db.ts';
import jwt from 'jsonwebtoken';

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

// Dashboard Stats (All roles can view dashboard)

router.get('/dashboard', requireAdmin, async (req, res) => {
  const rooms = await DbClient.getRooms();
  let sessions = await DbClient.getSessions();
  const authLogs = await DbClient.getAllAuthAttempts();
  
  const activeRooms = rooms.filter(r => r.status === 'ACTIVE').length;
  const activeSessions = sessions.filter(s => s.session_status === 'ACTIVE').length;
  
  // Real RADIUS status
  const radiusStatus = await radius.getStatus();

  // Database connectivity check
  let databaseStatus = "OFFLINE";
  try {
    const testRooms = await DbClient.getRooms();
    if (testRooms) databaseStatus = "ONLINE";
  } catch (e) {
    databaseStatus = "OFFLINE";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Daily unique users
  const todaySessions = sessions.filter(s => new Date(s.started_at) >= today);
  const wifiUsersToday = new Set(todaySessions.map(s => s.client_mac || s.network_username)).size;

  const yesterdaySessions = sessions.filter(s => {
    const d = new Date(s.started_at);
    return d >= yesterday && d < today;
  });
  const wifiUsersYesterday = new Set(yesterdaySessions.map(s => s.client_mac || s.network_username)).size;
  
  let usersTrendStr = undefined;
  let usersTrendUp = true;
  if (wifiUsersYesterday > 0) {
    const pct = Math.round(((wifiUsersToday - wifiUsersYesterday) / wifiUsersYesterday) * 100);
    usersTrendStr = pct >= 0 ? `+${pct}%` : `${pct}%`;
    usersTrendUp = pct >= 0;
  }

  // Failed attempts
  const failedToday = authLogs.filter((a: any) => a.result !== 'SUCCESS' && new Date(a.timestamp) >= today).length;
  const failedYesterday = authLogs.filter((a: any) => a.result !== 'SUCCESS' && new Date(a.timestamp) >= yesterday && new Date(a.timestamp) < today).length;
  
  let failedTrendStr = undefined;
  let failedTrendUp = true;
  if (failedYesterday > 0) {
    const pct = Math.round(((failedToday - failedYesterday) / failedYesterday) * 100);
    failedTrendStr = pct >= 0 ? `+${pct}%` : `${pct}%`;
    failedTrendUp = pct >= 0; // up is "bad" for failed
  }

  // Active Sessions trend is harder since it's a point-in-time state, but we can do total sessions today vs yesterday
  const totalSessionsToday = todaySessions.length;
  const totalSessionsYesterday = yesterdaySessions.length;
  
  let sessionsTrendStr = undefined;
  let sessionsTrendUp = true;
  if (totalSessionsYesterday > 0) {
    const pct = Math.round(((totalSessionsToday - totalSessionsYesterday) / totalSessionsYesterday) * 100);
    sessionsTrendStr = pct >= 0 ? `+${pct}%` : `${pct}%`;
    sessionsTrendUp = pct >= 0;
  }

  // Recent connections from auth logs
  const sortedAuth = [...authLogs].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentConnections = sortedAuth.slice(0, 5).map((l: any) => ({
    roomNumber: l.room_number,
    status: l.result,
    timestamp: l.timestamp,
    clientMac: l.client_mac || 'Unknown'
  }));

  res.json({
    activeRooms,
    activeSessions,
    sessionsTrendStr,
    sessionsTrendUp,
    wifiUsersToday,
    usersTrendStr,
    usersTrendUp,
    failedAttempts: failedToday,
    failedTrendStr,
    failedTrendUp,
    applicationStatus: "ONLINE",
    databaseStatus,
    radiusServerStatus: radiusStatus,
    recentConnections
  });
});


router.put('/rooms/:id', requireAdmin, requireRole(['IT_ADMIN', 'FRONT_DESK']), async (req, res) => {
  const id = req.params.id;
  const { status: newStatus, room_number, patient_last_name, valid_until, access_profile } = req.body;
  
  const updates: any = {};
  if (newStatus) updates.status = newStatus;
  if (room_number) updates.room_number = room_number;
  if (patient_last_name) updates.patient_last_name = patient_last_name;
  if (valid_until) updates.valid_until = valid_until;
  if (access_profile) updates.access_profile = access_profile;
  
  if (Object.keys(updates).length > 0) {
    await DbClient.updateRoom(id, updates);
  }
  
  if (newStatus === 'DISCHARGED' || newStatus === 'EXPIRED') {
    const activeSessions = await DbClient.getActiveSessionsByRoom(id);
    for (const session of activeSessions) {
      if (session.network_username && session.radius_session_id) {
        try {
          const success = await radius.disconnect({
            username: session.network_username,
            radiusSessionId: session.radius_session_id,
            clientIp: session.client_ip
          });
          if (!success) {
            console.warn(`[Network] Failed to disconnect session ${session.radius_session_id} via RADIUS CoA.`);
            await DbClient.logAudit({
              timestamp: new Date().toISOString(),
              administrator: 'SYSTEM',
              action: `CoA Disconnect Failed for ${session.network_username}`,
              module: 'Network',
              record_id: String(session.id),
            });
          }
        } catch (err: any) {
          console.error(`[Network] Error disconnecting session ${session.radius_session_id}:`, err.message);
          await DbClient.logAudit({
            timestamp: new Date().toISOString(),
            administrator: 'SYSTEM',
            action: `CoA Disconnect Error for ${session.network_username}`,
            module: 'Network',
            record_id: String(session.id),
          });
        }
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
    try {
      const success = await radius.disconnect({
        username: session.network_username,
        radiusSessionId: session.radius_session_id,
        clientIp: session.client_ip
      });
      if (!success) {
        console.warn(`[Network] Failed to disconnect session ${session.radius_session_id} via RADIUS CoA.`);
        await DbClient.logAudit({
          timestamp: new Date().toISOString(),
          administrator: 'SYSTEM',
          action: `CoA Disconnect Failed for ${session.network_username}`,
          module: 'Network',
          record_id: String(session.id),
        });
      }
    } catch (err: any) {
      console.error(`[Network] Error disconnecting session ${session.radius_session_id}:`, err.message);
      await DbClient.logAudit({
        timestamp: new Date().toISOString(),
        administrator: 'SYSTEM',
        action: `CoA Disconnect Error for ${session.network_username}`,
        module: 'Network',
        record_id: String(session.id),
      });
    }
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
      try {
        const success = await radius.disconnect({
          username: session.network_username,
          radiusSessionId: session.radius_session_id,
          clientIp: session.client_ip
        });
        if (!success) {
          console.warn(`[Network] Failed to disconnect session ${session.radius_session_id} via RADIUS CoA.`);
          await DbClient.logAudit({
            timestamp: new Date().toISOString(),
            administrator: 'SYSTEM',
            action: `CoA Disconnect Failed for ${session.network_username} (Block)`,
            module: 'Network',
            record_id: String(session.id),
          });
        }
      } catch (err: any) {
        console.error(`[Network] Error disconnecting session ${session.radius_session_id}:`, err.message);
        await DbClient.logAudit({
          timestamp: new Date().toISOString(),
          administrator: 'SYSTEM',
          action: `CoA Disconnect Error for ${session.network_username} (Block)`,
          module: 'Network',
          record_id: String(session.id),
        });
      }
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
  let logs = await DbClient.getAllAuthAttempts();
  const { start, end } = req.query;
  if (start && start !== 'undefined' && start !== '') logs = logs.filter(l => new Date(l.timestamp || 0) >= new Date(start as string));
  if (end && end !== 'undefined' && end !== '') logs = logs.filter(l => new Date(l.timestamp || 0) <= new Date(end as string));
  
  if (needsMasking((req as any).admin.role)) {
    const mapped = logs.map(l => ({ ...l, patient_last_name: maskSurname(l.patient_last_name) }));
    return res.json(mapped);
  }
  
  res.json(logs);
});

router.get('/audit-logs', requireAdmin, requireRole([]), async (req, res) => { // SUPER_ADMIN only
  let logs = await DbClient.getAllAuditLogs();
  const { start, end } = req.query;
  if (start && start !== 'undefined' && start !== '') logs = logs.filter(l => new Date(l.timestamp || 0) >= new Date(start as string));
  if (end && end !== 'undefined' && end !== '') logs = logs.filter(l => new Date(l.timestamp || 0) <= new Date(end as string));
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
  let sessions = await DbClient.getSessions();
  const { start, end } = req.query;
  if (start && start !== 'undefined' && start !== '') sessions = sessions.filter(s => new Date(s.started_at || 0) >= new Date(start as string));
  if (end && end !== 'undefined' && end !== '') sessions = sessions.filter(s => new Date(s.started_at || 0) <= new Date(end as string));
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
  let logs = await DbClient.getAllAuthAttempts();
  const { start, end } = req.query;
  if (start && start !== 'undefined' && start !== '') logs = logs.filter(l => new Date(l.timestamp || 0) >= new Date(start as string));
  if (end && end !== 'undefined' && end !== '') logs = logs.filter(l => new Date(l.timestamp || 0) <= new Date(end as string));
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
  let logs = await DbClient.getAllAuditLogs();
  const { start, end } = req.query;
  if (start && start !== 'undefined' && start !== '') logs = logs.filter(l => new Date(l.timestamp || 0) >= new Date(start as string));
  if (end && end !== 'undefined' && end !== '') logs = logs.filter(l => new Date(l.timestamp || 0) <= new Date(end as string));
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




// Purge old data
router.post('/purge', requireAdmin, requireRole(['SUPER_ADMIN', 'IT_ADMIN']), async (req, res) => {
  try {
    const result = await DbClient.purgeOldData();
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to purge old data', details: err.message });
  }
});

export default router;
