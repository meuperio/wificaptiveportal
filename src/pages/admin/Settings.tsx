import React, { useEffect, useState, useRef } from 'react';
import { Upload, Save, Image as ImageIcon } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    hospitalName: '',
    portalMessage: '',
    logoUrl: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Portal Texts</h2>
          
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Portal Welcome Message</label>
            <textarea
              value={settings.portalMessage}
              onChange={e => setSettings(prev => ({ ...prev, portalMessage: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-madocs-blue"
              placeholder="Welcome to our Guest Wi-Fi"
            />
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
