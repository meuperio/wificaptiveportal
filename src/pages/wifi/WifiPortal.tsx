import React, { useState, useEffect } from 'react';
import { Wifi, HeartPulse, Shield, AlertCircle } from 'lucide-react';

export default function WifiPortal() {
  const [roomNumber, setRoomNumber] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState<any>({ hospitalName: 'MADOCS+', portalMessage: 'Enter patient details to authenticate your device on the network.', logoUrl: '' });

  useEffect(() => {
    fetch('/api/v1/settings')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Could not load settings", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms || !acknowledgedPrivacy) {
      setError('You must accept the terms and privacy notice.');
      return;
    }

    if (!roomNumber || !patientLastName) {
      setError('Please provide both room number and patient last name.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/wifi/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber, patientLastName })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Unable to complete Wi-Fi authentication. Please contact hospital staff.');
      }
    } catch (err) {
      setError('Connection error. Please try again or contact staff.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-madocs-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Wifi className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connected Successfully</h2>
          <p className="text-sm text-slate-600 mb-8 leading-relaxed">You are now securely connected to the {settings.hospitalName || 'Manila Doctors Hospital'} guest network.</p>
          <button className="w-full bg-slate-50 text-slate-700 font-medium py-2.5 rounded-md hover:bg-slate-100 border border-slate-200 transition-colors text-sm">
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden bg-slate-50">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="bg-white rounded-xl p-6 sm:p-8 max-w-[400px] w-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/60 relative z-10">
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-10 object-contain mb-5" />
          ) : (
            <div className="w-10 h-10 bg-madocs-blue rounded-lg flex items-center justify-center mb-5 shadow-[0_2px_10px_rgba(0,51,102,0.2)]">
              <HeartPulse className="w-5 h-5 text-madocs-gold" />
            </div>
          )}
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Guest Wi-Fi Access</h1>
          <p className="text-sm text-slate-500 mt-2">{settings.portalMessage}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start gap-2.5 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Room Number</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-madocs-blue focus:bg-white transition-colors"
              placeholder="e.g. 301"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Patient Last Name</label>
            <input
              type="text"
              value={patientLastName}
              onChange={(e) => setPatientLastName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-madocs-blue focus:bg-white transition-colors"
              placeholder="e.g. SANTOS"
              autoComplete="off"
            />
          </div>

          <div className="pt-3 space-y-3 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center h-4 mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-madocs-blue focus:ring-madocs-blue cursor-pointer"
                />
              </div>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors leading-tight">
                I accept the <a href="#" className="text-madocs-blue hover:underline">Terms of Service</a> and Acceptable Use Policy.
              </span>
            </label>
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center h-4 mt-0.5">
                <input
                  type="checkbox"
                  checked={acknowledgedPrivacy}
                  onChange={(e) => setAcknowledgedPrivacy(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-madocs-blue focus:ring-madocs-blue cursor-pointer"
                />
              </div>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors leading-tight flex items-center gap-1.5">
                I acknowledge the <a href="#" className="text-madocs-blue hover:underline">Privacy Notice</a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-madocs-blue text-white text-sm font-semibold py-2.5 rounded-md hover:bg-madocs-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-madocs-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {loading ? 'Authenticating...' : 'Connect to Network'}
          </button>
        </form>
      </div>
    </div>
  );
}
