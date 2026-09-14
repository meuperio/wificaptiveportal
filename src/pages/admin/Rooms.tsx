import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, PowerOff, X } from 'lucide-react';

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [newRoomData, setNewRoomData] = useState({ room_number: '', patient_last_name: '', days_valid: 3, access_profile: 'STANDARD', status: 'ACTIVE' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const adminUserStr = localStorage.getItem('admin_user');
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
  const userRole = adminUser?.role || 'VIEWER';
  const canManageRooms = ['SUPER_ADMIN', 'IT_ADMIN', 'FRONT_DESK'].includes(userRole);

  useEffect(() => {
    fetchRooms();
  }, []);

  const openEditModal = (room: any) => {
    setEditingRoomId(room.id);
    const validUntilDate = new Date(room.valid_until);
    const diffTime = Math.abs(validUntilDate.getTime() - new Date().getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setNewRoomData({
      room_number: room.room_number,
      patient_last_name: room.patient_last_name,
      days_valid: diffDays > 0 ? diffDays : 1,
      access_profile: room.access_profile || 'STANDARD',
      status: room.status
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingRoomId(null);
    setNewRoomData({ room_number: '', patient_last_name: '', days_valid: 3, access_profile: 'STANDARD', status: 'ACTIVE' });
    setIsModalOpen(true);
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/v1/admin/rooms');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRooms(data);
        } else {
          setRooms([]);
        }
      } else {
        console.error('Failed to fetch rooms:', res.status);
        setRooms([]);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setRooms([]);
    }
  };

  const handleDischarge = async (id: number) => {
    await fetch(`/api/v1/admin/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DISCHARGED' })
    });
    fetchRooms();
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const validUntil = new Date(Date.now() + 86400000 * newRoomData.days_valid).toISOString();

    const url = editingRoomId ? `/api/v1/admin/rooms/${editingRoomId}` : '/api/v1/admin/rooms';
    const method = editingRoomId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_number: newRoomData.room_number,
        patient_last_name: newRoomData.patient_last_name,
        valid_until: validUntil,
        access_profile: newRoomData.access_profile,
        ...(editingRoomId && { status: newRoomData.status }) // Include status only if editing
      })
    });

    setIsSubmitting(false);

    if (res.ok) {
      setIsModalOpen(false);
      setNewRoomData({ room_number: '', patient_last_name: '', days_valid: 3, access_profile: 'STANDARD', status: 'ACTIVE' });
      fetchRooms();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Room Management</h1>
        {canManageRooms && (
          <button 
            onClick={openAddModal}
            className="bg-madocs-blue text-white px-4 py-2.5 rounded-lg font-medium hover:bg-madocs-blue-light transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Room / Patient
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by room or patient name..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="py-3 px-6">Room Number</th>
                <th className="py-3 px-6">Patient Last Name</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Valid Until</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map(room => (
                <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-slate-900">{room.room_number}</td>
                  <td className="py-3 px-6 text-slate-600">{room.patient_last_name}</td>
                  <td className="py-3 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      room.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      room.status === 'EXPIRED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm text-slate-500">
                    {new Date(room.valid_until).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 text-right space-x-2">
                    {canManageRooms && (
                      <button onClick={() => openEditModal(room)} className="p-1.5 text-slate-400 hover:text-madocs-blue rounded-md hover:bg-madocs-surface transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {room.status === 'ACTIVE' && canManageRooms && (
                      <button 
                        onClick={() => handleDischarge(room.id)}
                        className="p-1.5 text-slate-400 hover:text-orange-600 rounded-md hover:bg-orange-50 transition-colors" title="Discharge">
                        <PowerOff className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No rooms found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editingRoomId ? 'Edit Patient Room' : 'Add Patient Room'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddRoom} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={newRoomData.room_number}
                    onChange={(e) => setNewRoomData({ ...newRoomData, room_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                    placeholder="e.g., 301"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient Last Name</label>
                  <input
                    type="text"
                    value={newRoomData.patient_last_name}
                    onChange={(e) => setNewRoomData({ ...newRoomData, patient_last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue uppercase"
                    placeholder="e.g., SANTOS"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Access Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newRoomData.days_valid}
                    onChange={(e) => setNewRoomData({ ...newRoomData, days_valid: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Access Profile</label>
                  <select
                    value={newRoomData.access_profile}
                    onChange={(e) => setNewRoomData({ ...newRoomData, access_profile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue bg-white"
                  >
                    <option value="STANDARD">Standard (5 Mbps)</option>
                    <option value="PREMIUM">Premium (20 Mbps)</option>
                  </select>
                </div>
                {editingRoomId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={newRoomData.status}
                      onChange={(e) => setNewRoomData({ ...newRoomData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue bg-white"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="DISCHARGED">Discharged</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-madocs-blue hover:bg-madocs-blue-light rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingRoomId ? 'Update Room' : 'Authorize Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
