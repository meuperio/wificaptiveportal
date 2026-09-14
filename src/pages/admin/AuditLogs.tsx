import React, { useEffect, useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/audit-logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load audit logs", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 shadow-sm">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-800">System Audit Logs</h3>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search audit trail..." 
              className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-madocs-blue"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
                <th className="px-6 py-3 font-semibold">Administrator</th>
                <th className="px-6 py-3 font-semibold">Action</th>
                <th className="px-6 py-3 font-semibold">Module</th>
                <th className="px-6 py-3 font-semibold">Record ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No audit logs found.</td>
                </tr>
              ) : (
                logs.map((log: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-slate-600 font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                        {log.administrator}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-800 font-medium">{log.action}</td>
                    <td className="px-6 py-3 text-slate-500">{log.module}</td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">{log.record_id}</td>
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
