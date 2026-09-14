import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        localStorage.setItem('admin_auth', 'true');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen bg-madocs-surface flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-madocs-blue rounded-xl flex items-center justify-center shadow-sm">
            <Lock className="w-6 h-6 text-madocs-gold" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-madocs-blue mb-6">Administrator Login</h1>
        
        {error && <p className="text-sm text-red-600 mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
              required
            />
          </div>
          <button type="submit" className="w-full bg-madocs-blue text-white font-medium py-2.5 rounded-lg hover:bg-madocs-blue-light transition-colors shadow-sm">
            Login
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Demo Credentials:</p>
          <p>admin / admin</p>
        </div>
      </div>
    </div>
  );
}
