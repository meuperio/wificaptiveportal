import { useNavigate } from 'react-router-dom';
import { Wifi, Phone, Clock, MapPin, Shield, FileText, HeartPulse, ChevronRight, Bell, Stethoscope, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PublicLanding() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>({ hospitalName: 'MADOCS+', logoUrl: '' });

  useEffect(() => {
    fetch('/api/v1/settings')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setSettings(data);
        }
      })
      .catch(err => console.error("Could not load settings", err));
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-4 md:p-6 font-sans selection:bg-madocs-blue/20">
      {/* Main App Container with the Gradient Blue */}
      <div className="relative max-w-[1600px] mx-auto min-h-[calc(100vh-3rem)] rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#E0EFFF] via-[#C9E4FF] to-[#99CBFF] shadow-sm border border-white/60 flex flex-col">
        
        {/* Header */}
        <header className="px-6 md:px-12 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-8 md:h-10 object-contain" />
            ) : (
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 uppercase italic">
                {settings.hospitalName || 'MADOCS'}<span className="font-black">+</span>
              </h1>
            )}
          </div>
          
          <nav className="hidden lg:flex items-center gap-10">
            {['Home', 'About Us', 'Services', 'Doctors', 'Appointments', 'Blog'].map((item) => (
              <a key={item} href="#" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                {item}
              </a>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/wifi')}
              className="hidden md:block bg-white text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all"
            >
              Guest Wi-Fi
            </button>
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all text-slate-700">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

          {/* Hero Section */}
        <main className="flex-1 px-6 md:px-12 pt-8 pb-16 flex flex-col">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            
            {/* Left Column: Headline */}
            <div className="col-span-1 lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-white/50 rounded-full px-4 py-1.5 mb-6 md:mb-8 shadow-sm">
                <div className="w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-800">World-Class Care</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-medium text-slate-900 leading-[1.1] tracking-tight">
                Our Mission Delivering <br className="hidden sm:block" />
                Compassionate, <br className="hidden sm:block" />
                Patient-Centered Care
              </h2>
            </div>
            
            {/* Right Column: Description & Actions */}
            <div className="col-span-1 lg:col-span-5 flex flex-col justify-end pb-4 lg:pl-4">
              <p className="text-sm sm:text-base md:text-lg text-slate-800 font-medium leading-relaxed mb-6 md:mb-8 max-w-md">
                We strive to provide exceptional healthcare by focusing on compassion, innovation, and patient well-being—ensuring personalized care that empowers healthier lives and builds trust every step of the way.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <button
                  onClick={() => navigate('/wifi')}
                  className="bg-slate-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                >
                  Access Guest Wi-Fi
                </button>
              </div>
            </div>
            
          </div>

          {/* Bottom Image Area */}
          <div className="mt-12 md:mt-16 relative w-full lg:w-[65%]">
            {/* The Main Image */}
            <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=2000" 
                alt="Doctor examining patient"
                className="w-full h-full object-cover grayscale opacity-90 contrast-125"
              />
            </div>
            {/* Floating Stats Card (Overlapping bottom right) */}
            <div className="absolute -bottom-6 right-4 sm:-bottom-8 sm:right-8 lg:-right-24 bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-xl border border-white/60 w-[240px] sm:w-[300px] z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex -space-x-2 sm:-space-x-3">
                  <img className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150&h=150" alt="Doctor 1" />
                  <img className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white object-cover grayscale" src="https://images.unsplash.com/photo-1594824432258-f522e8697926?auto=format&fit=crop&q=80&w=150&h=150" alt="Doctor 2" />
                  <img className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150" alt="Doctor 3" />
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm z-10">
                    2K
                  </div>
                </div>
                <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors">
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <p className="text-slate-800 font-medium text-xs sm:text-[15px] leading-tight">
                More than 2K+ Doctors<br/>in your door
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
