import { useEffect, useState } from 'react';
import { WifiOff, Search, Download, Ban } from 'lucide-react';

export default function Sessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const adminUserStr = localStorage.getItem('admin_user');
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
  const userRole = adminUser?.role || 'VIEWER';

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/v1/admin/sessions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSessions(data);
        } else {
          setSessions([]);
        }
      } else {
        console.error('Failed to fetch sessions:', res.status);
        setSessions([]);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setSessions([]);
    }
  };

  const handleDisconnect = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect this device?')) return;
    await fetch(`/api/v1/admin/sessions/${id}/disconnect`, { method: 'POST' });
    fetchSessions();
  };

  const handleBlock = async (id: number, mac: string) => {
    if (!confirm(`Are you sure you want to block the device with MAC: ${mac}? They will be permanently blocked from re-authenticating.`)) return;
    await fetch(`/api/v1/admin/sessions/${id}/block`, { method: 'POST' });
    fetchSessions();
  };

  const handleDownloadCsv = () => {
    window.open('/api/v1/admin/reports/sessions/csv', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Wi-Fi Sessions</h1>
        <button
          onClick={handleDownloadCsv}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by identity or MAC..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="py-3 px-6">Identity</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">MAC Address</th>
                <th className="py-3 px-6">Login Time</th>
                <th className="py-3 px-6">RADIUS ID</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map(session => (
                <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-slate-900">{session.network_username}</td>
                  <td className="py-3 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      session.session_status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {session.session_status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm text-slate-500 font-mono">
                    {session.client_mac || '-'}
                  </td>
                  <td className="py-3 px-6 text-sm text-slate-500">
                    {new Date(session.started_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-sm text-slate-500 font-mono">
                    {session.radius_session_id}
                  </td>
                  <td className="py-3 px-6 text-right">
                    {session.session_status === 'ACTIVE' && ['SUPER_ADMIN', 'IT_ADMIN'].includes(userRole) && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDisconnect(session.id)}
                          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 font-medium px-2 py-1 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <WifiOff className="w-4 h-4" /> Disconnect
                        </button>
                        <button 
                          onClick={() => handleBlock(session.id, session.client_mac)}
                          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Ban className="w-4 h-4" /> Block
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No active sessions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
