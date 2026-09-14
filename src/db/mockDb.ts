// Mock database instance holding purely in-memory data
// Serves as MVP abstraction over PostgreSQL

export const mockDb = {
  rooms: [] as any[],
  adminUsers: [] as any[],
  wifiSessions: [] as any[],
  auditLogs: [] as any[],
  authAttempts: [] as any[],
  blockedDevices: [] as any[],
  settings: {
    hospitalName: 'General Hospital',
    portalMessage: 'Welcome to our Guest Wi-Fi',
    logoUrl: '' as string,
    primaryColor: '#003366',
    termsText: 'By using this service, you agree to our Terms of Service and Acceptable Use Policy.',
    privacyLink: '#',
    redirectUrl: 'https://www.maniladoctors.com.ph/',
    supportEmail: 'support@hospital.org',
    supportPhone: '+1-800-555-0199',
    sessionTimeout: 28800,
    maxDevicesPerRoom: 3,
    rateLimitFailures: 20,
    radiusHost: '127.0.0.1',
    radiusPort: 1812,
    radiusAccountingPort: 1813,
    radiusCoaPort: 3799,
    radiusSecret: 'testing123',
    radiusTimeout: 3000,
    radiusRetries: 3
  }
};

export function initMockDb() {
  console.log('[Mock DB] Initializing with sample data...');
  mockDb.adminUsers = [
    {
      id: 1,
      username: 'admin',
      password_hash: '$2b$10$n3SFJJogQte5bE5YHm/WNurgW4DX/x594WIe8ZBnyhC8B9V5FCplG',
      role: 'SUPER_ADMIN'
    },
    {
      id: 2,
      username: 'itadmin',
      password_hash: '$2b$10$riL2g58KPuUeOMKzlnnCv.Pzds/Ba8XDpfW6TNWSH6xnXoREm4Ee6',
      role: 'IT_ADMIN'
    },
    {
      id: 3,
      username: 'frontdesk',
      password_hash: '$2b$10$6/9hZflYYroxqdjig3WOgehxT.SfBIDl1VEyvIQSmHOC1o5cvf76O',
      role: 'FRONT_DESK'
    },
    {
      id: 4,
      username: 'viewer',
      password_hash: '$2b$10$5cy8kWozgkhOK0a2lyqyDOgHaZel217bSJtuqvOpAt46bw6oruYsG',
      role: 'VIEWER'
    }
  ];

  mockDb.rooms = [
    {
      id: 1,
      room_number: '301',
      patient_last_name: 'SANTOS',
      status: 'ACTIVE',
      valid_from: new Date(Date.now() - 86400000).toISOString(),
      valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
      max_devices: 3,
      session_duration_minutes: 480,
      access_profile: 'HOSPITAL-GUEST'
    },
    {
      id: 2,
      room_number: '302',
      patient_last_name: 'DELA CRUZ',
      status: 'ACTIVE',
      valid_from: new Date(Date.now() - 86400000).toISOString(),
      valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
      max_devices: 3,
    },
    {
      id: 3,
      room_number: '303',
      patient_last_name: 'REYES',
      status: 'ACTIVE',
      valid_from: new Date(Date.now() - 86400000).toISOString(),
      valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
    {
      id: 4,
      room_number: '304',
      patient_last_name: 'GARCIA',
      status: 'ACTIVE',
      valid_from: new Date(Date.now() - 86400000).toISOString(),
      valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
    {
      id: 5,
      room_number: '305',
      patient_last_name: 'MENDOZA',
      status: 'EXPIRED',
      valid_from: new Date(Date.now() - 86400000 * 5).toISOString(),
      valid_until: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 6,
      room_number: '306',
      patient_last_name: 'RAMOS',
      status: 'DISCHARGED',
      valid_from: new Date(Date.now() - 86400000).toISOString(),
      valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
    }
  ];
}
