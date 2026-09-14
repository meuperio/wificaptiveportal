import React, { useEffect, useState, useRef } from 'react';
import { Upload, Save, Image as ImageIcon } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    hospitalName: '',
    portalMessage: '',
    logoUrl: '',
    primaryColor: '#003366',
    termsText: '',
    privacyLink: '',
    redirectUrl: '',
    supportEmail: '',
    supportPhone: '',
    sessionTimeout: 28800,
    maxDevicesPerRoom: 3,
    rateLimitFailures: 20,
    radiusHost: '',
    radiusPort: 1812,
    radiusAccountingPort: 1813,
    radiusCoaPort: 3799,
    radiusSecret: '',
    radiusTimeout: 3000,
    radiusRetries: 3
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/v1/settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    
    await fetch('/api/v1/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestRadius = async () => {
    setTestResult(null);
    try {
      const res = await fetch('/api/v1/admin/settings/test-radius', {
        method: 'POST'
      });
      const data = await res.json();
      setTestResult({ success: res.ok, message: data.message || (res.ok ? 'Connection successful' : 'Connection failed') });
    } catch (err) {
      setTestResult({ success: false, message: 'Network error while testing RADIUS' });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Hospital Configuration</h1>
      
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-8">
        
        {/* Brand & Logo Section */}
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Branding & Logo</h2>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Logo Preview */}
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden group">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
              )}
              
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" /> Change
                </button>
              </div>
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Logo</label>
                <p className="text-xs text-slate-500 mb-3">Upload a custom logo to replace the default text on the captive portal and admin dashboard.</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload Image
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Text Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2">Portal Texts & Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Name</label>
              <input
                type="text"
                value={settings.hospitalName}
                onChange={e => setSettings(prev => ({ ...prev, hospitalName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                placeholder="Manila Doctors Hospital"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Success Redirect URL</label>
              <input
                type="url"
                value={settings.redirectUrl}
                onChange={e => setSettings(prev => ({ ...prev, redirectUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                placeholder="https://hospital.org/welcome"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Portal Welcome Message</label>
            <textarea
              value={settings.portalMessage}
              onChange={e => setSettings(prev => ({ ...prev, portalMessage: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
              placeholder="Welcome to our Guest Wi-Fi"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary Brand Color (Hex)</label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg border border-slate-200 shrink-0" 
                  style={{ backgroundColor: settings.primaryColor || '#003366' }} 
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue uppercase"
                  placeholder="#003366"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Privacy Notice Link URL</label>
              <input
                type="url"
                value={settings.privacyLink}
                onChange={e => setSettings(prev => ({ ...prev, privacyLink: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue mt-0 md:mt-[42px]"
                placeholder="https://hospital.org/privacy"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Terms and Conditions</label>
            <textarea
              value={settings.termsText}
              onChange={e => setSettings(prev => ({ ...prev, termsText: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
              placeholder="By using this network..."
            />
          </div>
        </div>

        {/* Global Security & Session Policies */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2">Security & Session Policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Session Timeout (s)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={e => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 28800 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Devices / Room</label>
              <input
                type="number"
                value={settings.maxDevicesPerRoom}
                onChange={e => setSettings(prev => ({ ...prev, maxDevicesPerRoom: parseInt(e.target.value) || 3 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Global IP Rate Limit</label>
              <input
                type="number"
                value={settings.rateLimitFailures}
                onChange={e => setSettings(prev => ({ ...prev, rateLimitFailures: parseInt(e.target.value) || 20 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                title="Max failures per 10 minutes"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                placeholder="support@hospital.org"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Support Phone</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={e => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
                placeholder="+1-800-555-0199"
              />
            </div>
          </div>
        </div>

        {/* RADIUS Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4 pb-2">
            <h2 className="text-base font-semibold text-slate-900">RADIUS Server Configuration</h2>
            <button 
              type="button" 
              onClick={handleTestRadius}
              className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Test Connection
            </button>
          </div>
          
          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {testResult.message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RADIUS Host IP</label>
              <input
                type="text"
                value={settings.radiusHost}
                onChange={e => setSettings(prev => ({ ...prev, radiusHost: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue font-mono text-sm"
                placeholder="10.0.0.50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shared Secret</label>
              <input
                type="password"
                value={settings.radiusSecret}
                onChange={e => setSettings(prev => ({ ...prev, radiusSecret: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue font-mono text-sm"
                placeholder="••••••••••••"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Auth Port</label>
              <input
                type="number"
                value={settings.radiusPort}
                onChange={e => setSettings(prev => ({ ...prev, radiusPort: parseInt(e.target.value) || 1812 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue font-mono text-sm"
                placeholder="1812"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Acct Port</label>
              <input
                type="number"
                value={settings.radiusAccountingPort}
                onChange={e => setSettings(prev => ({ ...prev, radiusAccountingPort: parseInt(e.target.value) || 1813 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue font-mono text-sm"
                placeholder="1813"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CoA Port</label>
              <input
                type="number"
                value={settings.radiusCoaPort}
                onChange={e => setSettings(prev => ({ ...prev, radiusCoaPort: parseInt(e.target.value) || 3799 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue font-mono text-sm"
                placeholder="3799"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Timeout (ms)</label>
              <input
                type="number"
                value={settings.radiusTimeout}
                onChange={e => setSettings(prev => ({ ...prev, radiusTimeout: parseInt(e.target.value) || 3000 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue font-mono text-sm"
                placeholder="3000"
              />
            </div>
          </div>
        </div>
        
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          {saveSuccess ? (
            <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
              ✓ Settings saved successfully
            </span>
          ) : <span></span>}
          
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-madocs-blue text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-madocs-blue-light transition-colors shadow-sm flex items-center gap-2 disabled:opacity-75"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
        
      </form>
    </div>
  );
}
