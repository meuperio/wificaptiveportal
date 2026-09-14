import { useState } from 'react';
import { Outlet, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BedDouble, Activity, Users, LogOut, KeyRound, HeartPulse, Search, Bell, Settings as SettingsIcon, Menu, X, ShieldAlert, ClipboardList } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', error: '', success: '', loading: false });

  // Simplified auth check for MVP
  const hasToken = localStorage.getItem('admin_auth') === 'true';
  const adminUserStr = localStorage.getItem('admin_user');
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
  const userRole = adminUser?.role || 'VIEWER';
  
  if (!hasToken) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await fetch('/api/v1/admin/logout', { method: 'POST' });
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdForm(prev => ({ ...prev, error: '', success: '', loading: true }));
    try {
      const res = await fetch('/api/v1/admin/my-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPwdForm(prev => ({ ...prev, success: 'Password updated successfully!', oldPassword: '', newPassword: '' }));
        setTimeout(() => setShowPasswordModal(false), 2000);
      } else {
        setPwdForm(prev => ({ ...prev, error: data.error || 'Failed to update password' }));
      }
    } catch (err) {
      setPwdForm(prev => ({ ...prev, error: 'Network error occurred' }));
    } finally {
      setPwdForm(prev => ({ ...prev, loading: false }));
    }
  };

  const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'IT_ADMIN', 'FRONT_DESK', 'VIEWER'] },
    { name: 'Room Directory', path: '/admin/rooms', icon: BedDouble, roles: ['SUPER_ADMIN', 'IT_ADMIN', 'FRONT_DESK', 'VIEWER'] },
    { name: 'Active Sessions', path: '/admin/sessions', icon: Activity, roles: ['SUPER_ADMIN', 'IT_ADMIN', 'FRONT_DESK', 'VIEWER'] },
    { name: 'Auth Logs', path: '/admin/auth-logs', icon: ShieldAlert, roles: ['SUPER_ADMIN', 'IT_ADMIN', 'VIEWER'] },
    { name: 'Audit Trail', path: '/admin/audit-logs', icon: ClipboardList, roles: ['SUPER_ADMIN'] },
    { name: 'Administrators', path: '/admin/users', icon: Users, roles: ['SUPER_ADMIN'] },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon, roles: ['SUPER_ADMIN'] },
  ].filter(item => item.roles.includes(userRole));

  const getPageTitle = () => {
    const item = navItems.find(item => location.pathname.includes(item.path));
    return item ? item.name : 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-madocs-surface flex font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/75 flex flex-col z-30 transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/75 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-madocs-blue rounded-lg flex items-center justify-center shadow-sm">
               <HeartPulse className="w-5 h-5 text-madocs-gold" />
            </div>
            <span className="font-bold text-madocs-blue tracking-tight">MadocsAdmin</span>
          </div>
          <button 
            className="md:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Network Controls</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-madocs-surface text-madocs-blue'
                      : 'text-slate-600 hover:text-madocs-blue hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-4 border-t border-slate-200/75 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-md bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 bg-madocs-blue-light rounded-full flex items-center justify-center text-white font-medium text-xs uppercase">
              {adminUser?.username?.substring(0, 2) || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{adminUser?.username || 'Administrator'}</p>
              <p className="text-xs text-slate-500 truncate">{userRole.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setPwdForm({ oldPassword: '', newPassword: '', error: '', success: '', loading: false });
              setShowPasswordModal(true);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors mb-1"
          >
            <KeyRound className="w-4 h-4" />
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] h-screen w-full md:w-auto overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200/75 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              className="md:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 truncate">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden lg:flex relative max-w-md w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                 type="text" 
                 placeholder="Search resources... (⌘K)" 
                 className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200/75 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-madocs-blue focus:bg-white transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 md:border-l border-slate-200 md:pl-6">
              <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-semibold border border-green-200/60 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                RADIUS MOCK
              </div>
            </div>
          </div>
        </header>
        
        {adminUser?.username === 'admin' && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-center gap-2 shrink-0">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">Security Warning: You are using the default seeded 'admin' account. Please change your password immediately.</span>
          </div>
        )}
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6">
              {pwdForm.error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                  {pwdForm.error}
                </div>
              )}
              {pwdForm.success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                  {pwdForm.success}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Old Password</label>
                  <input
                    type="password"
                    required
                    value={pwdForm.oldPassword}
                    onChange={e => setPwdForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={pwdForm.newPassword}
                    onChange={e => setPwdForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdForm.loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-madocs-blue hover:bg-madocs-blue-light rounded-lg transition-colors disabled:opacity-50"
                >
                  {pwdForm.loading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
