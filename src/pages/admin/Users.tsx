import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [newUserData, setNewUserData] = useState({ username: '', password: '', role: 'VIEWER' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const adminUserStr = localStorage.getItem('admin_user');
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
  const userRole = adminUser?.role || 'VIEWER';
  const canManageUsers = ['SUPER_ADMIN'].includes(userRole);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const openAddModal = () => {
    setEditingUserId(null);
    setNewUserData({ username: '', password: '', role: 'VIEWER' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setNewUserData({ username: user.username, password: '', role: user.role });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this administrator account?')) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const url = editingUserId ? `/api/v1/admin/users/${editingUserId}` : '/api/v1/admin/users';
    const method = editingUserId ? 'PUT' : 'POST';

    const payload = { ...newUserData };
    if (editingUserId && !payload.password) {
      delete (payload as any).password;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save user');
      }
    } catch (err) {
      console.error('Save error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 mt-2">You do not have permission to view or manage administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Administrator Accounts</h1>
        <button 
          onClick={openAddModal}
          className="bg-madocs-blue text-white px-4 py-2.5 rounded-lg font-medium hover:bg-madocs-blue-light transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Administrator
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="py-3 px-6">Username</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-slate-900">{user.username}</td>
                  <td className="py-3 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'IT_ADMIN' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'FRONT_DESK' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right space-x-2">
                    <button onClick={() => openEditModal(user)} className="p-1.5 text-slate-400 hover:text-madocs-blue rounded-md hover:bg-madocs-surface transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">
                    No administrators found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editingUserId ? 'Edit Administrator' : 'Add Administrator'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                    placeholder="Enter unique username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {editingUserId ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required={!editingUserId}
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                    placeholder={editingUserId ? "••••••••" : "Enter secure password"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    required
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue bg-white"
                  >
                    <option value="VIEWER">Viewer (Reports only)</option>
                    <option value="FRONT_DESK">Front Desk (Room Management)</option>
                    <option value="IT_ADMIN">IT Admin (Rooms, Logs, Sessions)</option>
                    <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-madocs-blue hover:bg-madocs-blue-light rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
