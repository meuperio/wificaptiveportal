/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLanding from './pages/public/PublicLanding';
import WifiPortal from './pages/wifi/WifiPortal';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Rooms from './pages/admin/Rooms';
import Sessions from './pages/admin/Sessions';
import AdminLogin from './pages/admin/AdminLogin';
import Settings from './pages/admin/Settings';
import AuthLogs from './pages/admin/AuthLogs';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLanding />} />
        <Route path="/wifi" element={<WifiPortal />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="auth-logs" element={<AuthLogs />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
