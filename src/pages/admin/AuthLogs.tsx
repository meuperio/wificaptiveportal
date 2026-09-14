import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Search, Download } from 'lucide-react';

export default function AuthLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetch(`/api/v1/admin/authentication-logs?start=${startDate}&end=${endDate}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load auth logs", err);
        setLoading(false);
      });
  }, [startDate, endDate]);

  const handleDownloadCsv = () => {
    window.open(`/api/v1/admin/reports/authentication-logs/csv?start=${startDate}&end=${endDate}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Authentication Logs</h1>
        <button
          onClick={handleDownloadCsv}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 shadow-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-800">Authentication Logs</h3>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-madocs-blue"
            />
            <span className="text-sm text-slate-500">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-madocs-blue"
            />
            <div className="relative ml-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-madocs-blue"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
                <th className="px-6 py-3 font-semibold">Room</th>
                <th className="px-6 py-3 font-semibold">Result</th>
                <th className="px-6 py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No authentication logs found.</td>
                </tr>
              ) : (
                logs.map((log: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-slate-600 font-medium">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-slate-900 font-medium">{log.room_number}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        log.result === 'SUCCESS' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {log.result === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {log.result}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{log.failure_reason || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
