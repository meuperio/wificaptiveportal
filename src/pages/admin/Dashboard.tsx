import { useEffect, useState } from 'react';
import { Activity, Users, BedDouble, AlertCircle, Wifi, ArrowUpRight, ArrowDownRight, Server, Database, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/admin/dashboard')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-madocs-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const cards = [
    { title: 'Active Rooms', value: stats.activeRooms, icon: BedDouble },
    { title: 'Wi-Fi Sessions', value: stats.activeSessions, icon: Wifi, trend: stats.sessionsTrendStr, trendUp: stats.sessionsTrendUp },
    { title: 'Failed Attempts', value: stats.failedAttempts, icon: AlertCircle, trend: stats.failedTrendStr, trendUp: stats.failedTrendUp },
    { title: 'Daily Unique Users', value: stats.wifiUsersToday, icon: Users, trend: stats.usersTrendStr, trendUp: stats.usersTrendUp },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(card => (
          <div key={card.title} className="bg-white p-5 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.05)] border border-slate-200/60 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">{card.title}</span>
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100">
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{card.value}</h3>
              {card.trend && (
                <div className={`flex items-center text-xs font-medium ${card.trendUp ? (card.title === 'Failed Attempts' ? 'text-red-600' : 'text-emerald-600') : (card.title === 'Failed Attempts' ? 'text-emerald-600' : 'text-red-600')}`}>
                  {card.trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {card.trend}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status Bento Box */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.05)] border border-slate-200/60 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-slate-900">Infrastructure Health</h2>
            <button className="text-sm font-medium text-madocs-blue hover:text-madocs-blue-light transition-colors">View Logs &rarr;</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600">
                  <Server className="w-5 h-5" />
                </div>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Application Node</p>
                <p className="text-sm font-semibold text-slate-900">{stats.applicationStatus}</p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600">
                  <Database className="w-5 h-5" />
                </div>
                <span className={`flex h-2.5 w-2.5 rounded-full ${stats.databaseStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Firebase / Firestore</p>
                <p className="text-sm font-semibold text-slate-900">{stats.databaseStatus}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className={`flex h-2.5 w-2.5 rounded-full ${stats.radiusServerStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">RADIUS Auth</p>
                <p className="text-sm font-semibold text-slate-900">{stats.radiusServerStatus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.05)] border border-slate-200/60">
          <h2 className="text-base font-semibold text-slate-900 mb-6">Recent Connections</h2>
          <div className="space-y-4">
             {/* Mocking recent connections for visual completeness of the SaaS dashboard */}
             {(stats.recentConnections || []).length === 0 ? (
               <p className="text-sm text-slate-500">No recent connections.</p>
             ) : (
               stats.recentConnections.map((evt: any, idx: number) => {
                 const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                 return (
                   <div key={idx} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full ${evt.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                       <div>
                         <p className="text-sm font-medium text-slate-900">Room {evt.roomNumber}</p>
                         <p className="text-xs text-slate-500">Authentication {evt.status}</p>
                       </div>
                     </div>
                     <span className="text-xs font-medium text-slate-400">{timeStr}</span>
                   </div>
                 );
               })
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
