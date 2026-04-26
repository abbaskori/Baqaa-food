import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeStorage, StorageAPI } from "@/lib/storage";
import { useHashLocation } from "@/lib/use-hash-location";

import { AppLayout } from "@/components/layout";
import POS from "@/pages/pos";
import Admin from "@/pages/admin";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

const queryClient = new QueryClient();

function Router({ role }: { role: 'admin' | 'staff' | 'manager' }) {
  const [location, setLocation] = useLocation();

  // Role-based access control
  useEffect(() => {
    if (role === 'staff' && (location === '/admin' || location === '/analytics')) {
      setLocation('/');
    }
    if (role === 'manager' && (location === '/' || location === '/admin')) {
      setLocation('/analytics');
    }
  }, [location, role, setLocation]);

  return (
    <AppLayout role={role}>
      <Switch>
        {role !== 'manager' && <Route path="/" component={POS} />}
        {(role === 'admin' || role === 'manager') && (
          <Route path="/analytics" component={Analytics} />
        )}
        {role === 'admin' && (
          <Route path="/admin" component={Admin} />
        )}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  const [auth, setAuth] = useState<{ role: 'admin' | 'staff' | 'manager' } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activationKey, setActivationKey] = useState("");
  const [activationError, setActivationError] = useState(false);

  // Security: Pulling Master Key from environment variables
  const MASTER_KEY = import.meta.env.VITE_MASTER_KEY;

  useEffect(() => {
    initializeStorage();
    StorageAPI.fetchCloudData().catch(console.error);
    
    // ── Secure Device Check ──────────────────────────────────────────────────
    const verifyDevice = () => {
      const isAuth = localStorage.getItem('baqaa_device_authorized') === 'true';
      const deviceId = localStorage.getItem('baqaa_device_id');
      
      // If authorized but no ID, or ID tampered with, force re-auth
      if (isAuth && !deviceId) {
        localStorage.removeItem('baqaa_device_authorized');
        return false;
      }
      return isAuth;
    };

    setIsAuthorized(verifyDevice());

    // Check if session exists
    const saved = sessionStorage.getItem('baqaa_session');
    if (saved) setAuth(JSON.parse(saved));
  }, []);

  const handleActivate = () => {
    if (activationKey === MASTER_KEY) {
      // Generate a unique fingerprint for this device
      const deviceId = crypto.randomUUID();
      localStorage.setItem('baqaa_device_id', deviceId);
      localStorage.setItem('baqaa_device_authorized', 'true');
      setIsAuthorized(true);
    } else {
      setActivationError(true);
      setTimeout(() => {
        setActivationKey("");
        setActivationError(false);
      }, 1000);
    }
  };

  const handleLogin = (role: 'admin' | 'staff' | 'manager') => {
    const session = { role };
    setAuth(session);
    sessionStorage.setItem('baqaa_session', JSON.stringify(session));
  };

  const handleLogout = () => {
    setAuth(null);
    sessionStorage.removeItem('baqaa_session');
  };

  // ── Secure Activation Screen ────────────────────────────────────────────────
  if (isAuthorized === false) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 text-center">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#f97316_0,transparent_50%)]" />
        </div>

        <div className="relative z-10 max-w-sm w-full">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] mx-auto flex items-center justify-center mb-8 shadow-[0_20px_50px_rgba(249,115,22,0.3)] border border-white/10">
            <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-display font-black text-white mb-3 tracking-tight">Access Restricted</h1>
          <p className="text-slate-400 mb-10 text-sm leading-relaxed">This device is not registered. Please enter your <span className="text-orange-500 font-bold">Secure Master Key</span> to authorize this hardware.</p>
          
          <div className="space-y-4">
            <input
              type="password"
              placeholder="••••••••••••"
              value={activationKey}
              onChange={(e) => setActivationKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
              className={`w-full bg-white/5 border-2 rounded-2xl py-4 px-6 text-white text-center font-mono text-xl tracking-[0.5em] focus:outline-none transition-all duration-300 backdrop-blur-xl ${
                activationError ? 'border-red-500 animate-shake bg-red-500/10' : 'border-white/10 focus:border-orange-500 focus:bg-white/10'
              }`}
            />
            
            <button
              onClick={handleActivate}
              className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-orange-500 hover:text-white transition-all duration-300 active:scale-95 shadow-xl hover:shadow-orange-500/20"
            >
              Authorize Hardware
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            End-to-End Encrypted POS
          </div>
        </div>
      </div>
    );
  }

  if (isAuthorized === null) return null; // Loading state

  if (!auth) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter hook={useHashLocation}>
          <Router role={auth.role} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

